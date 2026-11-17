import { lazy } from 'react'
import { textHeadings } from './parts.js'
import TextSection from './TextSection.jsx'

export default {
  type: 'text',
  label: 'Text',
  description: 'Formatted text in one to three columns, with an optional heading above.',
  // layout and width: see layouts.js. heading: optional plain text above the columns, headingLevel: 1 to 3.
  // The text itself is stored per column, as it is written.
  defaultContent: { layout: 'one', width: 'medium' },
  Render: TextSection,
  headings: textHeadings,
  Settings: lazy(() => import('./TextSettings.jsx')),
}
