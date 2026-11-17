import EditableHeading from '../EditableHeading.jsx'
import RichText from '../RichText.jsx'
import { isEmptyDoc, textToDoc } from '../richText.js'
import { COLUMN_NAMES, FULL_WIDTH, HEADING_LEVELS, getHeadingLevel, getTextLayout, getTextWidth } from './layouts.js'
import './text.css'

// An optional heading, then formatted text in one, two or three columns (see layouts.js).
// The heading sits above all the columns; its level is picked from the toolbar that floats
// above it while it is being typed into. The layout, and the width of a one-column section,
// are chosen in the section's settings.
export default function TextSection({ content, onChange }) {
  const layout = getTextLayout(content.layout)
  const single = layout.columns.length === 1

  const columns = layout.columns.map((_, index) => {
    const name = COLUMN_NAMES[index]
    // Text sections written before formatting existed stored plain text in `text`.
    const value = content[name] ?? (index === 0 && content.text !== undefined ? textToDoc(content.text) : undefined)
    return { name, value }
  })

  const hasHeading = Boolean(content.heading?.trim())
  const headingLevel = getHeadingLevel(content.headingLevel).id

  // Nothing to show visitors until something has been written.
  if (!onChange && !hasHeading && columns.every((column) => isEmptyDoc(column.value))) return null

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
      {/* While editing the heading is always there to type into; visitors only get it if
          it has been filled in. */}
      {(onChange || hasHeading) && (
        <EditableHeading
          className="section-text-heading"
          value={content.heading}
          level={headingLevel}
          levels={HEADING_LEVELS}
          onChange={onChange && ((heading) => onChange('heading', heading))}
          onLevelChange={onChange && ((level) => onChange('headingLevel', level))}
          placeholder="Heading (optional)"
        />
      )}
      <div className="section-text-columns">
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
      </div>
    </section>
  )
}
