// How a text section can be laid out. `columns` lists the columns' relative widths, so
// [1, 2] is two columns with the second twice as wide as the first.
export const TEXT_LAYOUTS = [
  { id: 'one', label: 'One column', columns: [1] },
  { id: 'two', label: 'Two columns', columns: [1, 1] },
  { id: 'three', label: 'Three columns', columns: [1, 1, 1] },
  { id: 'narrow-wide', label: 'Narrow and wide', hint: 'One third, two thirds', columns: [1, 2] },
  { id: 'wide-narrow', label: 'Wide and narrow', hint: 'Two thirds, one third', columns: [2, 1] },
]

// How wide a one-column text section is. More than one column always uses the full width.
export const TEXT_WIDTHS = [
  { id: 'narrow', label: 'Narrow', maxWidth: '32rem' },
  { id: 'medium', label: 'Medium', maxWidth: '44rem' },
  { id: 'wide', label: 'Wide', maxWidth: '64rem' },
]

export const FULL_WIDTH = '64rem'

// The levels the heading above the columns can be: 1 is the largest and most important.
export const HEADING_LEVELS = [
  { id: 1, label: 'Heading 1' },
  { id: 2, label: 'Heading 2' },
  { id: 3, label: 'Heading 3' },
]

export function getHeadingLevel(id) {
  // Level 2 is what the heading was before the level could be chosen.
  return HEADING_LEVELS.find((level) => level.id === Number(id)) ?? HEADING_LEVELS[1]
}

export function getTextLayout(id) {
  return TEXT_LAYOUTS.find((layout) => layout.id === id) ?? TEXT_LAYOUTS[0]
}

export function getTextWidth(id) {
  // Medium is what text sections were before the width could be chosen.
  return TEXT_WIDTHS.find((width) => width.id === id) ?? TEXT_WIDTHS[1]
}

// Where each column's text is kept in the section's content: content.body for the first
// column, content.body2 for the second, and so on.
export const COLUMN_NAMES = ['body', 'body2', 'body3']
