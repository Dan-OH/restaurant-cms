import { lazy } from 'react'
import { DEFAULT_IMAGE_PRESET } from '../imagePresets.js'
import { richTextHeadings } from '../richText.js'
import ImageTextSection from './ImageTextSection.jsx'

export default {
  type: 'image-text',
  label: 'Image and text',
  description: 'An image with text beside it, on the left or the right.',
  // preset, original, cropped, alt: the image (see EditableImage.jsx). body: the text.
  // imageSide: 'left' or 'right'.
  defaultContent: { preset: DEFAULT_IMAGE_PRESET, original: null, cropped: null, alt: '', imageSide: 'left' },
  Render: ImageTextSection,
  headings: (content) => richTextHeadings(content.body),
  Settings: lazy(() => import('./ImageTextSettings.jsx')),
}
