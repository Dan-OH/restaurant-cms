import { supabase } from './supabase.js'
import { assetIdsIn, deleteAssetFiles } from './images.js'
import { pagePaths } from './pageTree.js'

// Loads every uploaded image for the Assets page, newest first:
//
//   [{ ...asset row, crops: [{ ...crop row, usedOn }], usedOn }]
//
// `usedOn` lists the pages whose saved content shows that file: [{ id, title, path,
// published }]. An asset's own `usedOn` covers all of its crops (and the original, should a
// section ever show it directly). Changes not yet saved in the page editor don't count.
export async function loadAssets() {
  const [assets, pages, sections] = await Promise.all([
    supabase.from('assets').select('*, asset_crops(*)').order('created_at', { ascending: false }),
    supabase.from('pages').select('id, title, slug, parent_id, kind, published'),
    supabase.from('page_sections').select('page_id, content'),
  ])
  const failed = [assets, pages, sections].find((result) => result.error)
  if (failed) throw new Error(failed.error.message)

  const paths = pagePaths(pages.data)
  const pageById = new Map(pages.data.map((page) => [page.id, page]))

  // Storage path -> ids of the pages that use it. Sections keep image paths among their
  // content values (see src/sections/EditableImage.jsx); any string value that matches a
  // stored file counts, so section designs with several images are covered too.
  const users = new Map()
  for (const section of sections.data) {
    for (const value of stringValues(section.content)) {
      if (!users.has(value)) users.set(value, new Set())
      users.get(value).add(section.page_id)
    }
  }
  const usedOn = (...filePaths) => {
    const ids = new Set(filePaths.flatMap((path) => [...(users.get(path) ?? [])]))
    return [...ids]
      .map((id) => pageById.get(id))
      .filter(Boolean)
      .map((page) => ({ id: page.id, title: page.title, path: paths.get(page.id), published: page.published }))
      .sort((a, b) => a.title.localeCompare(b.title))
  }

  return assets.data.map(({ asset_crops: crops, ...asset }) => ({
    ...asset,
    crops: crops
      .map((crop) => ({ ...crop, usedOn: usedOn(crop.path) }))
      .sort((a, b) => b.created_at.localeCompare(a.created_at)),
    usedOn: usedOn(asset.original_path, ...crops.map((crop) => crop.path)),
  }))
}

// Deletes an asset for good: takes it out of every page section that shows it (the image
// spot is left empty, ready for a new upload; the rest of the section is kept), then
// removes its files and its record, crops included.
export async function deleteAsset(assetId) {
  const { data: sections, error } = await supabase.from('page_sections').select('id, content')
  if (error) throw new Error(error.message)

  const affected = sections.filter((section) => assetIdsIn(section.content).has(assetId))
  const results = await Promise.all(
    affected.map((section) =>
      supabase
        .from('page_sections')
        .update({ content: withoutAsset(section.content, assetId) })
        .eq('id', section.id),
    ),
  )
  const failed = results.find((result) => result.error)
  if (failed) throw new Error(`Could not remove it from the pages: ${failed.error.message}`)

  await deleteAssetFiles(assetId)
  const { error: rowError } = await supabase.from('assets').delete().eq('id', assetId)
  if (rowError) throw new Error(rowError.message)
}

// Deletes those of the given assets that no saved page section uses any more.
export async function deleteUnusedAssets(assetIds) {
  if (!assetIds.size) return
  const { data: sections, error } = await supabase.from('page_sections').select('content')
  if (error) throw new Error(error.message)
  const used = assetIdsIn(sections.map((section) => section.content))
  for (const id of assetIds) {
    if (used.has(id)) continue
    await deleteAssetFiles(id)
    const { error: rowError } = await supabase.from('assets').delete().eq('id', id)
    if (rowError) throw new Error(rowError.message)
  }
}

// A copy of `value` with every path of the asset replaced by null.
function withoutAsset(value, assetId) {
  if (typeof value === 'string') return assetIdsIn(value).has(assetId) ? null : value
  if (Array.isArray(value)) return value.map((child) => withoutAsset(child, assetId))
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, withoutAsset(child, assetId)]))
  }
  return value
}

// Formats every browser can draw. Others (e.g. HEIC from an iPhone) can still be uploaded
// and cropped where the browser supports them, but aren't used for previews.
export const VIEWABLE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/avif']

// The file to show for an asset in small previews: the newest crop in use, else the newest
// crop, else the original. Crops are modest JPEGs; originals can be many megabytes.
export function previewPath(asset) {
  const crop = asset.crops.find((item) => item.usedOn.length > 0) ?? asset.crops[0]
  if (crop) return crop.path
  return VIEWABLE_TYPES.includes(asset.mime_type) ? asset.original_path : null
}

function* stringValues(value) {
  if (typeof value === 'string') yield value
  else if (value && typeof value === 'object') {
    for (const child of Object.values(value)) yield* stringValues(child)
  }
}

// "4.2 MB", "860 KB".
export function formatBytes(bytes) {
  if (bytes == null) return null
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function formatDate(timestamp) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(timestamp))
}
