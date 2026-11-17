import EditableHeading from '../EditableHeading.jsx'
import RichText from '../RichText.jsx'
import { splitLevels } from '../headings.js'
import { isEmptyDoc } from '../richText.js'
import { FULL_WIDTH, HEADING_LEVELS, getTextWidth } from './layouts.js'
import { textParts } from './parts.js'
import './text.css'

// An optional heading, then formatted text in one, two or three columns (see layouts.js).
// The heading sits above all the columns; its level is picked from the toolbar that floats
// above it while it is being typed into. The layout, and the width of a one-column section,
// are chosen in the section's settings.
export default function TextSection({ content, onChange, headingLevels }) {
  const { layout, columns, hasHeading, headingLevel } = textParts(content)
  const single = layout.columns.length === 1

  // Nothing to show visitors until something has been written.
  if (!onChange && !hasHeading && columns.every((column) => isEmptyDoc(column.value))) return null

  // On the live site, which element each heading uses: the section's heading first, then the
  // headings in each column, in the same order as textHeadings() in parts.js lists them.
  const [headingTag, ...columnLevels] = splitLevels(headingLevels, [
    hasHeading ? 1 : 0,
    ...columns.map((column) => column.headings.length),
  ])

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
          tagLevel={headingTag?.[0]}
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
            headingLevels={columnLevels[index]}
          />
        ))}
      </div>
    </section>
  )
}
