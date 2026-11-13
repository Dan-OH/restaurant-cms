// Helpers for the page tree. Pages and groups are rows of the same table; a row with
// kind = 'group' can contain other rows, which point at it through parent_id.

import { HOME_SLUG } from './site.js'

export const ROOT = null

export function parentOf(row) {
  return row.parent_id ?? ROOT
}

// Map of parent id (ROOT for the top level) -> its children, in display order.
export function childrenByParent(rows) {
  const map = new Map()
  for (const row of rows) {
    const key = parentOf(row)
    if (!map.has(key)) map.set(key, [])
    map.get(key).push(row)
  }
  for (const children of map.values()) {
    children.sort((a, b) => a.nav_order - b.nav_order || a.title.localeCompare(b.title))
  }
  return map
}

// Map of row id -> its address on the site. The address is the slugs of the groups the row
// sits in, followed by its own: the page "lunch" in the group "menus" is "/menus/lunch".
// The top-level page with the home slug is "/". Rows whose parent is missing are left out.
export function pagePaths(rows) {
  const byId = new Map(rows.map((row) => [row.id, row]))
  const paths = new Map()
  for (const row of rows) {
    const segments = []
    const seen = new Set()
    let current = row
    // Walk up to the top level. `seen` stops this looping forever if the data had a cycle.
    while (current && !seen.has(current.id)) {
      seen.add(current.id)
      segments.unshift(current.slug)
      if (current.parent_id == null) {
        const isHome = row.kind !== 'group' && row.parent_id == null && row.slug === HOME_SLUG
        paths.set(row.id, isHome ? '/' : `/${segments.join('/')}`)
        break
      }
      current = byId.get(current.parent_id)
    }
  }
  return paths
}

// Ids of everything inside the given group, at any depth (not including the group itself).
export function descendantIds(rows, id) {
  const tree = childrenByParent(rows)
  const found = new Set()
  const queue = [id]
  while (queue.length) {
    for (const child of tree.get(queue.pop()) ?? []) {
      // The guard also stops this looping forever if the data ever contained a cycle.
      if (!found.has(child.id)) {
        found.add(child.id)
        queue.push(child.id)
      }
    }
  }
  return found
}

// The nav_order that places a new item at the bottom of the given parent.
export function nextNavOrder(rows, parentId) {
  const siblings = rows.filter((row) => parentOf(row) === parentId)
  return siblings.length ? Math.max(...siblings.map((row) => row.nav_order)) + 1 : 0
}

// Groups an item may be placed in, in tree order, labelled with their full path
// ("Menus / Drinks"). Pass excludeId when moving a group, so it can't go inside itself.
export function groupOptions(rows, excludeId) {
  const tree = childrenByParent(rows)
  const options = []
  function walk(parentId, path) {
    for (const row of tree.get(parentId) ?? []) {
      if (row.kind !== 'group' || row.id === excludeId) continue
      const label = [...path, row.title].join(' / ')
      options.push({ id: row.id, label })
      walk(row.id, [...path, row.title])
    }
  }
  walk(ROOT, [])
  return options
}
