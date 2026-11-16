import EditableText from '../EditableText.jsx'
import './text.css'

// One block of text. Line breaks and blank lines are kept as typed.
export default function TextSection({ content, onChange }) {
  // Nothing to show visitors until some text has been written.
  if (!onChange && !content.text?.trim()) return null

  return (
    <section className="section-text">
      <EditableText
        value={content.text}
        onChange={onChange && ((text) => onChange('text', text))}
        placeholder="Write something…"
      />
    </section>
  )
}
