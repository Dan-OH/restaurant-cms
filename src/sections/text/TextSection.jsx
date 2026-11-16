import RichText from '../RichText.jsx'
import { isEmptyDoc, textToDoc } from '../richText.js'
import './text.css'

// One block of formatted text.
export default function TextSection({ content, onChange }) {
  // Text sections written before formatting existed stored plain text in `text`.
  const body = content.body ?? textToDoc(content.text)

  // Nothing to show visitors until some text has been written.
  if (!onChange && isEmptyDoc(body)) return null

  return (
    <section className="section-text">
      <RichText
        value={body}
        onChange={
          onChange &&
          ((next) => {
            onChange('body', next)
            // Once edited, the old plain-text copy is out of date; drop it.
            if (content.text !== undefined) onChange('text', undefined)
          })
        }
        placeholder="Write something…"
      />
    </section>
  )
}
