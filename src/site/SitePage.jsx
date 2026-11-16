import { lazy, Suspense, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { HOME_SLUG, SITE_NAME } from '../lib/site.js'
import { getSectionType } from '../sections/index.js'

// The editing controls are admin UI built with Chakra, fetched only when an editor turns
// content editing on.
const ContentEditor = lazy(() => import('../admin/ContentEditor.jsx'))

function Sections({ sections }) {
  return sections.map((section) => {
    // Each kind of section draws itself; see src/sections/. A section whose kind has been
    // removed from the site's files is skipped.
    const Section = getSectionType(section.type)?.Render
    return Section ? <Section key={section.id} content={section.content} /> : null
  })
}

export default function SitePage() {
  // SiteLayout loads the pages, works out which one the current URL points at, and loads
  // its sections. While an editor is editing, `sections` is their unsaved working copy.
  const { loading, page, sections, editing, setSections } = useOutletContext()

  useEffect(() => {
    const isHome = page?.slug === HOME_SLUG && page.parent_id == null
    document.title = page && !isHome ? `${page.title} | ${SITE_NAME}` : SITE_NAME
  }, [page])

  if (loading) return null

  if (!page) {
    return (
      <div className="site-not-found">
        <h1>Page not found</h1>
      </div>
    )
  }

  if (editing) {
    return (
      // Until the editor has downloaded, show the page as it normally looks.
      <Suspense fallback={<Sections sections={sections} />}>
        <ContentEditor sections={sections} onChange={setSections} />
      </Suspense>
    )
  }

  return <Sections sections={sections} />
}
