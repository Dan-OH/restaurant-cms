import { useCallback, useEffect, useState } from 'react'
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
//   saving, error
export function usePageSections(pageId, editing) {
  // Both are tagged with the page they belong to, so one page's sections are never shown,
  // or saved, against another page after navigating.
  const [loaded, setLoaded] = useState(null)
  const [draft, setDraft] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

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
        return { pageId, sections: update(sections) }
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
    const rows = working.map((section, position) => ({ ...section, page_id: pageId, position }))
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
    setLoaded({ pageId, sections: working })
    return true
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
