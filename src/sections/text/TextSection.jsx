import RichText from '../RichText.jsx'
import { isEmptyDoc, textToDoc } from '../richText.js'
import { COLUMN_NAMES, FULL_WIDTH, getTextLayout, getTextWidth } from './layouts.js'
import './text.css'

// Formatted text in one, two or three columns (see layouts.js). The layout, and the width
// of a one-column section, are chosen in the section's settings.
export default function TextSection({ content, onChange }) {
  const layout = getTextLayout(content.layout)
  const single = layout.columns.length === 1

  const columns = layout.columns.map((_, index) => {
    const name = COLUMN_NAMES[index]
    // Text sections written before formatting existed stored plain text in `text`.
    const value = content[name] ?? (index === 0 && content.text !== undefined ? textToDoc(content.text) : undefined)
    return { name, value }
  })

  // Nothing to show visitors until some text has been written.
  if (!onChange && columns.every((column) => isEmptyDoc(column.value))) return null

  return (
    <section
      className="section-text"
      style={{
        // Read by text.css. Kept out of the element's own grid styles so that the phone
        // layout in text.css can still override them.
        '--section-text-width': single ? getTextWidth(content.width).maxWidth : FULL_WIDTH,
        '--section-text-columns': layout.columns.map((width) => `minmax(0, ${width}fr)`).join(' '),
      }}
    >
      {columns.map((column, index) => (
        <RichText
          key={column.name}
          value={column.value}
          onChange={
            onChange &&
            ((next) => {
              onChange(column.name, next)
              // Once edited, the old plain-text copy is out of date; drop it.
              if (index === 0 && content.text !== undefined) onChange('text', undefined)
            })
          }
          placeholder="Write something…"
        />
      ))}
    </section>
  )
}
