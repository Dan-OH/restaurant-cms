import { lazy, Suspense, useState } from 'react'
import EditableText from './EditableText.jsx'

// The level buttons are admin UI, fetched only while an editor is editing.
const HeadingLevelToolbar = lazy(() => import('../admin/HeadingLevelToolbar.jsx'))

// A heading that can be typed into directly on the page while it is being edited. While it
// has the cursor, a small toolbar floats above it for choosing its level.
//
//   value          The heading text.
//   level          The level chosen for the heading, e.g. 2. Sets its look.
//   tagLevel       On the live site, the element level to use instead (see headings.js).
//                  The look still follows `level`.
//   levels         The levels on offer: [{ id, label }], e.g. { id: 2, label: 'Heading 2' }.
//   onChange       Called with the new text. Pass it (and onLevelChange) only while editing.
//   onLevelChange  Called with the chosen level.
//   placeholder    Shown, faded, while editing and empty.
//   className      Class for the heading element; it also gets `${className}-${level}`.
export default function EditableHeading({
  value,
  level,
  tagLevel,
  levels,
  onChange,
  onLevelChange,
  placeholder,
  className = '',
}) {
  const [focused, setFocused] = useState(false)

  const heading = (
    <EditableText
      as={`h${tagLevel ?? level}`}
      className={`${className} ${className}-${level}`}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
    />
  )

  if (!onChange) return heading

  return (
    <div
      onFocus={() => setFocused(true)}
      onBlur={(event) => {
        // Moving the focus onto the toolbar's own buttons (with the keyboard) keeps it open.
        if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false)
      }}
    >
      {focused && (
        <Suspense fallback={null}>
          <HeadingLevelToolbar levels={levels} level={level} onLevelChange={onLevelChange} />
        </Suspense>
      )}
      {heading}
    </div>
  )
}
