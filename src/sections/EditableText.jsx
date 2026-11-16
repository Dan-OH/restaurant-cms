import './editable.css'

// A block of text that can be typed into directly on the page while it is being edited.
// Section designs use this for their text so editors can fill it in where it appears.
//
//   value        The text.
//   onChange     Called with the new text on every keystroke. Pass it only while editing;
//                without it this is ordinary, read-only text.
//   placeholder  Shown, faded, while editing and empty.
//
// Line breaks are kept exactly as typed, in both modes, so what the editor sees while
// typing is what visitors get.
export default function EditableText({ value, onChange, placeholder }) {
  const text = value ?? ''

  if (!onChange) return <div className="editable-text">{text}</div>

  return (
    // The hidden copy of the text gives the box its height, so the text area on top of it
    // grows and wraps exactly like the read-only version.
    <div className="editable-text editable-text-editing">
      <div aria-hidden="true">{text || placeholder} </div>
      <textarea
        value={text}
        placeholder={placeholder}
        rows={1}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  )
}
