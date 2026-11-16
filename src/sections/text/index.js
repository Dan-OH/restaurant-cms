import { lazy } from 'react'
import TextSection from './TextSection.jsx'

export default {
  type: 'text',
  label: 'Text',
  description: 'Text with headings, bold, italics and lists, in one to three columns.',
  // layout and width: see layouts.js. The text itself is stored per column, as it is written.
  defaultContent: { layout: 'one', width: 'medium' },
  Render: TextSection,
  Settings: lazy(() => import('./TextSettings.jsx')),
}
