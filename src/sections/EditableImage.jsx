import { lazy, Suspense } from 'react'
import { imageUrl } from '../lib/images.js'
import { getImagePreset } from './imagePresets.js'
import './editable-image.css'

// Uploading and cropping are admin UI, fetched only while an editor is editing.
const ImageEditor = lazy(() => import('../admin/ImageEditor.jsx'))

// An image that can be uploaded, replaced and cropped directly on the page while it is
// being edited. Section designs use this for their image.
//
//   content   The section's content. The image uses these values in it:
//               preset    The shape, one of imagePresets.js.
//               original  Storage path of the file as uploaded, kept for re-cropping.
//               cropped   Storage path of the cropped version, which is what is shown.
//               alt       Description for screen readers.
//   onChange  The section's onChange. Pass it only while editing; without it this is an
//             ordinary image, or nothing at all if none has been uploaded.
//
// The shape and description are changed in the section's settings: see image/ImageSettings.jsx.
export default function EditableImage({ content, onChange }) {
  const preset = getImagePreset(content.preset)

  const image = content.cropped ? (
    <img
      src={imageUrl(content.cropped)}
      alt={content.alt ?? ''}
      // The shape is known before the file arrives, so the page doesn't jump as it loads.
      width={preset.width}
      height={preset.height}
      loading="lazy"
    />
  ) : null

  if (!onChange) return image && <div className="editable-image">{image}</div>

  return (
    <div className="editable-image">
      {/* Until the editor has downloaded, show the image as it normally looks. */}
      <Suspense fallback={image}>
        <ImageEditor content={content} onChange={onChange} image={image} />
      </Suspense>
    </div>
  )
}
