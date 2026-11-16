import EditableImage from '../EditableImage.jsx'
import './image.css'

// A single image.
export default function ImageSection({ content, onChange }) {
  // Nothing to show visitors until an image has been uploaded.
  if (!onChange && !content.cropped) return null

  return (
    <section className="section-image">
      <EditableImage content={content} onChange={onChange} />
    </section>
  )
}
