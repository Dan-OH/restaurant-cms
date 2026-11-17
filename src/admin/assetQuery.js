import { IMAGE_PRESETS } from '../sections/imagePresets.js'

// Filtering and sorting for the Assets page. Assets are as loaded by loadAssets() in
// src/lib/assets.js. The page keeps the current choices in its address (?sort=…&page=…),
// so they survive reloading and going back.

export const USAGE_FILTERS = [
  { id: 'all', label: 'All', test: () => true },
  { id: 'used', label: 'In use', test: (asset) => asset.usedOn.length > 0 },
  { id: 'unused', label: 'Not in use', test: (asset) => asset.usedOn.length === 0 },
]

// Ties are broken by date, newest first.
const newest = (a, b) => b.created_at.localeCompare(a.created_at)
const byName = (a, b) =>
  (a.file_name ?? '').localeCompare(b.file_name ?? '', undefined, { numeric: true, sensitivity: 'base' })
// Unknown values go last whichever way the list runs.
const numeric = (value, direction) => (a, b) => {
  const x = value(a)
  const y = value(b)
  if (x == null || y == null) return (x == null) - (y == null)
  return (y - x) * direction
}

// `grouped` options don't sort a flat list: they show one group per page (see groupByPage).
export const SORTS = [
  { id: 'newest', label: 'Newest first', compare: newest },
  { id: 'oldest', label: 'Oldest first', compare: (a, b) => -newest(a, b) },
  { id: 'page', label: 'Page used on', compare: newest, grouped: true },
  { id: 'most-used', label: 'Used on most pages', compare: (a, b) => b.usedOn.length - a.usedOn.length },
  { id: 'largest', label: 'File size: largest', compare: numeric((asset) => asset.size_bytes, 1) },
  { id: 'smallest', label: 'File size: smallest', compare: numeric((asset) => asset.size_bytes, -1) },
  {
    id: 'pixels',
    label: 'Dimensions: largest',
    compare: numeric((asset) => (asset.width ? asset.width * asset.height : null), 1),
  },
  { id: 'name', label: 'Name: A–Z', compare: byName },
  { id: 'name-desc', label: 'Name: Z–A', compare: (a, b) => -byName(a, b) },
]

export const DEFAULTS = { q: '', usage: 'all', page: '', shape: '', sort: 'newest' }

// The current choices from the address, falling back to the defaults for anything missing
// or no longer valid.
export function readQuery(params) {
  const query = Object.fromEntries(Object.entries(DEFAULTS).map(([key, value]) => [key, params.get(key) ?? value]))
  if (!USAGE_FILTERS.some((option) => option.id === query.usage)) query.usage = DEFAULTS.usage
  if (!SORTS.some((option) => option.id === query.sort)) query.sort = DEFAULTS.sort
  return query
}

// Every page any asset is used on, for the page filter: [{ id, title, path }] by title.
export function pagesInUse(assets) {
  const pages = new Map()
  for (const asset of assets) for (const page of asset.usedOn) pages.set(page.id, page)
  return [...pages.values()].sort((a, b) => a.title.localeCompare(b.title))
}

// The shapes the assets have been cropped to, for the shape filter, in the presets' order.
// 'none' stands for assets that were never cropped.
export function shapesInUse(assets) {
  const ids = new Set(assets.flatMap((asset) => asset.crops.map((crop) => crop.preset)))
  const shapes = IMAGE_PRESETS.filter((preset) => ids.has(preset.id)).map((preset) => ({
    id: preset.id,
    label: `${preset.label} (${preset.ratio})`,
  }))
  if (assets.some((asset) => asset.crops.length === 0)) shapes.push({ id: 'none', label: 'Never cropped' })
  return shapes
}

// Everything except the usage filter, so the usage buttons can show how many of each there are.
export function filterAssets(assets, query) {
  const words = query.q.trim().toLowerCase().split(/\s+/).filter(Boolean)
  return assets.filter((asset) => {
    const name = (asset.file_name ?? '').toLowerCase()
    if (!words.every((word) => name.includes(word))) return false
    if (query.page && !asset.usedOn.some((page) => page.id === query.page)) return false
    if (query.shape === 'none') return asset.crops.length === 0
    if (query.shape && !asset.crops.some((crop) => crop.preset === query.shape)) return false
    return true
  })
}

export function applyUsage(assets, usage) {
  const test = USAGE_FILTERS.find((option) => option.id === usage).test
  return assets.filter(test)
}

export function sortAssets(assets, sortId) {
  const sort = SORTS.find((option) => option.id === sortId)
  return [...assets].sort((a, b) => sort.compare(a, b) || newest(a, b))
}

// One group per page, by page title, then the images not in use: [{ key, page, assets }].
// An image used on several pages appears under each of them. With a page filter on, only
// that page's group is shown.
export function groupByPage(assets, onlyPageId) {
  const groups = new Map()
  const unused = []
  for (const asset of assets) {
    if (asset.usedOn.length === 0) unused.push(asset)
    for (const page of asset.usedOn) {
      if (onlyPageId && page.id !== onlyPageId) continue
      if (!groups.has(page.id)) groups.set(page.id, { key: page.id, page, assets: [] })
      groups.get(page.id).assets.push(asset)
    }
  }
  const result = [...groups.values()].sort((a, b) => a.page.title.localeCompare(b.page.title))
  if (unused.length) result.push({ key: 'unused', page: null, assets: unused })
  return result
}
