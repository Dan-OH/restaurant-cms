// Heading levels on the live site.
//
// Editors pick a heading's level for how it looks (Heading 1 is largest). Screen readers and
// search engines, though, read headings as an outline of the page, which works best when:
//   - the page has exactly one h1, and it is the first heading, and
//   - levels never skip on the way down (an h2 can be followed by an h3, not by an h4).
//
// So on the live site each heading's element is worked out from the headings before it,
// while it keeps the look the editor chose (sections style headings by the chosen level,
// not by the element). While editing, headings use their chosen level as-is.
//
// How it works: the first heading on the page becomes the h1. After that, each heading
// goes one level below the nearest earlier heading that was chosen as more important
// (a smaller number) than it, or one level below the h1 if there isn't one. For example,
// chosen levels  2, 3, 3, 2, 3  become  h1, h2, h2, h2, h3,  and if a Heading 1 is then
// added at the top,  1, 2, 3, 3, 2, 3  become  h1, h2, h3, h3, h2, h3.

const DEEPEST = 6

// Takes the chosen levels of every heading on the page, in page order, and returns the
// element level each should use, in the same order.
export function outlineLevels(chosenLevels) {
  const result = []
  // The page's h1, and the headings currently "open" beneath it, outermost first.
  let top = null
  const open = []

  for (const chosen of chosenLevels) {
    if (!top) {
      top = { chosen, level: 1 }
      result.push(1)
      continue
    }
    // Close anything that this heading is a sibling of, or more important than.
    while (open.length && open.at(-1).chosen >= chosen) open.pop()
    const parent = open.at(-1) ?? top
    const level = Math.min(parent.level + 1, DEEPEST)
    open.push({ chosen, level })
    result.push(level)
  }
  return result
}

// Splits a page's list of levels into one list per part, given how many headings each part
// has: splitLevels([1, 2, 2, 3], [1, 0, 3]) is [[1], [], [2, 2, 3]]. When `levels` is
// undefined (while editing), each part gets undefined, meaning "use the chosen levels".
export function splitLevels(levels, counts) {
  if (!levels) return counts.map(() => undefined)
  let start = 0
  return counts.map((count) => {
    const part = levels.slice(start, start + count)
    start += count
    return part
  })
}
