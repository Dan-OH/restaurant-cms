import { lazy, Suspense } from 'react'
import { imageUrl } from '../../lib/images.js'
import { getImagePreset } from './presets.js'
import './image.css'

// Uploading and cropping are admin UI, fetched only while an editor is editing.
const ImageSectionEditor = lazy(() => import('./ImageSectionEditor.jsx'))

// A single image. Visitors get the cropped version; the original is kept in storage so it
// can be cropped again for a different shape.
export default function ImageSection({ content, onChange }) {
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

  if (!onChange) {
    // Nothing to show visitors until an image has been uploaded.
    return image && <section className="section-image">{image}</section>
  }

  return (
    <section className="section-image">
      <Suspense fallback={image}>
        <ImageSectionEditor content={content} onChange={onChange} image={image} />
      </Suspense>
    </section>
  )
}
