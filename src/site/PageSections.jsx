import { outlineLevels, splitLevels } from '../sections/headings.js'
import { getSectionType } from '../sections/index.js'

// A page's sections as visitors see them. Before drawing, it lists every heading on the page
// and works out which element each should use (see src/sections/headings.js), then hands
// each section the levels for its own headings.
export default function PageSections({ sections }) {
  // Each kind of section draws itself; see src/sections/. A section whose kind has been
  // removed from the site's files is skipped.
  const drawn = sections
    .map((section) => ({ section, definition: getSectionType(section.type) }))
    .filter(({ definition }) => definition)

  const chosen = drawn.map(({ section, definition }) => definition.headings?.(section.content) ?? [])
  const levels = splitLevels(
    outlineLevels(chosen.flat()),
    chosen.map((headings) => headings.length),
  )

  return drawn.map(({ section, definition }, index) => {
    const Section = definition.Render
    return <Section key={section.id} content={section.content} headingLevels={levels[index]} />
  })
}
