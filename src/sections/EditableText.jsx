import './editable.css'

// A piece of plain text that can be typed into directly on the page while it is being
// edited. Section designs use this for short text such as headings.
//
//   value        The text.
//   onChange     Called with the new text on every keystroke. Pass it only while editing;
//                without it this is ordinary, read-only text.
//   placeholder  Shown, faded, while editing and empty.
//   as           The HTML element to draw, e.g. "h2". Defaults to a plain block.
//   className    Extra class for that element, for the section's own styling.
//
// Line breaks are kept exactly as typed, in both modes, so what the editor sees while
// typing is what visitors get.
export default function EditableText({ value, onChange, placeholder, as: Element = 'div', className = '' }) {
  const text = value ?? ''

  if (!onChange) return <Element className={`editable-text ${className}`}>{text}</Element>

  return (
    // The hidden copy of the text gives the box its height, so the text area on top of it
    // grows and wraps exactly like the read-only version.
    <Element className={`editable-text editable-text-editing ${className}`}>
      <span aria-hidden="true">{text || placeholder} </span>
      <textarea
        value={text}
        placeholder={placeholder}
        aria-label={placeholder}
        rows={1}
        onChange={(event) => onChange(event.target.value)}
      />
    </Element>
  )
}
