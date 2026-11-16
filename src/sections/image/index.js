import { lazy } from 'react'
import ImageSection from './ImageSection.jsx'
import { DEFAULT_IMAGE_PRESET } from './presets.js'

export default {
  type: 'image',
  label: 'Image',
  description: 'A single image, cropped to a shape you choose.',
  // preset: one of presets.js. original / cropped: storage paths of the uploaded file and
  // of the cropped version shown on the site. alt: description for screen readers.
  defaultContent: { preset: DEFAULT_IMAGE_PRESET, original: null, cropped: null, alt: '' },
  Render: ImageSection,
  Settings: lazy(() => import('./ImageSettings.jsx')),
}
