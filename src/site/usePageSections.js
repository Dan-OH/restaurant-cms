import { useCallback, useEffect, useRef, useState } from 'react'
import { assetIdsIn } from '../lib/images.js'
import { supabase } from '../lib/supabase.js'

// Loads the sections of one page and, while `editing` is true, holds the editor's unsaved
// working copy of them.
//
// Returns:
//   sections     What to draw on the page: the working copy while editing (so the page
//                updates as the editor types), otherwise what is saved.
//   editing      True once editing is on and the page's sections have loaded.
//   setSections  Change the working copy: setSections((current) => next).
//   dirty        True when the working copy differs from what is saved.
//   save()       Writes the working copy to the database; resolves to true on success.
//                Images of removed sections are then deleted, unless another page uses them.
//   saving, error
export function usePageSections(pageId, editing) {
  // Both are tagged with the page they belong to, so one page's sections are never shown,
  // or saved, against another page after navigating.
  const [loaded, setLoaded] = useState(null)
  const [draft, setDraft] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  // Images that were in sections removed since the last save, including ones uploaded to a
  // section that was removed before it was ever saved. Checked (and deleted if nothing uses
  // them any more) after saving.
  const removedAssets = useRef(new Set())

  useEffect(() => {
    if (!pageId) return
    let cancelled = false
    supabase
      .from('page_sections')
      .select('id, type, content')
      .eq('page_id', pageId)
      .order('position')
      .then(({ data, error }) => {
        if (error) console.error('Could not load page content', error)
        if (!cancelled) setLoaded({ pageId, sections: data ?? [] })
      })
    return () => {
      cancelled = true
    }
  }, [pageId])

  // Leaving edit mode, or the page, throws the working copy away.
  useEffect(() => {
    if (!editing) return
    return () => {
      setDraft(null)
      setError('')
    }
  }, [editing, pageId])

  // (Checked with && rather than ?. on purpose: before a page is known, pageId is undefined,
  // and `loaded?.pageId === pageId` would then be true with nothing loaded.)
  const saved = loaded && loaded.pageId === pageId ? loaded.sections : null
  // Until the first change, the working copy is simply what is saved.
  const working = editing && saved ? (draft && draft.pageId === pageId ? draft.sections : saved) : null
  const dirty = working !== null && JSON.stringify(working) !== JSON.stringify(saved)

  const setSections = useCallback(
    (update) => {
      setDraft((current) => {
        const sections = current && current.pageId === pageId ? current.sections : (saved ?? [])
        const next = update(sections)
        const keptIds = new Set(next.map((section) => section.id))
        for (const section of sections) {
          if (!keptIds.has(section.id)) assetIdsIn(section.content, removedAssets.current)
        }
        return { pageId, sections: next }
      })
    },
    [pageId, saved],
  )

  // Ask the browser to warn before closing or reloading the tab with unsaved changes.
  useEffect(() => {
    if (!dirty) return
    const warn = (event) => event.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  // Resolves to true when everything was saved.
  async function save() {
    if (!working) return false
    setError('')
    setSaving(true)
    // An image has one description, shown wherever it appears (see syncDescriptions in
    // lib/assets.js). Descriptions written or changed here are copied to the other sections
    // on this page that show the same image, and after saving to the image's other pages.
    const descriptions = changedDescriptions(saved, working)
    const synced = working.map((section) => {
      const id = [...assetIdsIn(section.content)].find((assetId) => descriptions.has(assetId))
      return id === undefined || section.content.alt === descriptions.get(id)
        ? section
        : { ...section, content: { ...section.content, alt: descriptions.get(id) } }
    })
    const rows = synced.map((section, position) => ({ ...section, page_id: pageId, position }))
    const keptIds = new Set(rows.map((row) => row.id))
    const removedIds = saved.map((section) => section.id).filter((id) => !keptIds.has(id))

    // Sections have ids from the moment they are added, so one "upsert" both creates the
    // new ones and updates the rest.
    let error = null
    if (rows.length) ({ error } = await supabase.from('page_sections').upsert(rows))
    if (!error && removedIds.length) ({ error } = await supabase.from('page_sections').delete().in('id', removedIds))

    setSaving(false)
    if (error) {
      setError(`Could not save: ${error.message}`)
      return false
    }
    setLoaded({ pageId, sections: synced })
    if (synced.some((section, index) => section !== working[index])) setDraft({ pageId, sections: synced })
    deleteRemovedImages(saved.filter((section) => removedIds.includes(section.id)))
    if (descriptions.size) {
      import('../lib/assets.js')
        .then(({ syncDescriptions }) => syncDescriptions(descriptions))
        .catch((problem) => console.error('Could not update image descriptions', problem))
    }
    return true
  }

  // Runs in the background after a save. Only images no saved section anywhere uses are
  // deleted, so one still shown on another page (or still in this one) is kept.
  function deleteRemovedImages(removedSections) {
    const candidates = new Set(removedAssets.current)
    for (const section of removedSections) assetIdsIn(section.content, candidates)
    removedAssets.current = new Set()
    if (!candidates.size) return
    // The asset helpers are admin-only code, so visitors never download them.
    import('../lib/assets.js')
      .then(({ deleteUnusedAssets }) => deleteUnusedAssets(candidates))
      .catch((problem) => console.error('Could not delete unused images', problem))
  }

  return {
    sections: working ?? saved ?? [],
    editing: working !== null,
    setSections,
    dirty,
    saving,
    error,
    save,
  }
}

// Asset id -> description, for each image whose description was written or changed in the
// working copy since the last save. Clearing a description only affects that one section.
function changedDescriptions(saved, working) {
  const before = new Map(saved.map((section) => [section.id, section.content]))
  const descriptions = new Map()
  for (const section of working) {
    const alt = (section.content.alt ?? '').trim()
    if (!alt) continue
    const previous = before.get(section.id)
    const sameImages =
      previous && [...assetIdsIn(previous)].join() === [...assetIdsIn(section.content)].join()
    if (sameImages && (previous.alt ?? '').trim() === alt) continue
    for (const id of assetIdsIn(section.content)) descriptions.set(id, alt)
  }
  return descriptions
}
