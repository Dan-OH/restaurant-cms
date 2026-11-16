import EditableImage from '../EditableImage.jsx'
import RichText from '../RichText.jsx'
import { isEmptyDoc } from '../richText.js'
import './image-text.css'

// An image and a block of formatted text, side by side. On narrow screens they stack,
// image first.
export default function ImageTextSection({ content, onChange }) {
  const editing = Boolean(onChange)
  // While editing both halves always show, so each can be filled in. Visitors only get
  // the halves that have something in them.
  const showImage = editing || Boolean(content.cropped)
  const showText = editing || !isEmptyDoc(content.body)
  if (!showImage && !showText) return null

  const side = content.imageSide === 'right' ? 'right' : 'left'

  return (
    <section className={`section-image-text section-image-text-${side}`}>
      {showImage && (
        <div className="section-image-text-image">
          <EditableImage content={content} onChange={onChange} />
        </div>
      )}
      {showText && (
        <div className="section-image-text-text">
          <RichText
            value={content.body}
            onChange={onChange && ((body) => onChange('body', body))}
            placeholder="Write something…"
          />
        </div>
      )}
    </section>
  )
}
