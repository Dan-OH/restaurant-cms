import { richTextHeadings, textToDoc } from '../richText.js'
import { COLUMN_NAMES, getHeadingLevel, getTextLayout } from './layouts.js'

// The parts of a text section, worked out from its content. Used both to draw the section
// (TextSection.jsx) and to list its headings (below), so the two always agree on which
// headings there are and in what order.
export function textParts(content) {
  const layout = getTextLayout(content.layout)
  const columns = layout.columns.map((_, index) => {
    const name = COLUMN_NAMES[index]
    // Text sections written before formatting existed stored plain text in `text`.
    const value = content[name] ?? (index === 0 && content.text !== undefined ? textToDoc(content.text) : undefined)
    return { name, value, headings: richTextHeadings(value) }
  })
  return {
    layout,
    columns,
    hasHeading: Boolean(content.heading?.trim()),
    headingLevel: getHeadingLevel(content.headingLevel).id,
  }
}

// The chosen levels of the headings visitors see, in order: the section's heading (if it has
// one), then the headings inside each column in turn.
export function textHeadings(content) {
  const parts = textParts(content)
  return [...(parts.hasHeading ? [parts.headingLevel] : []), ...parts.columns.flatMap((column) => column.headings)]
}
