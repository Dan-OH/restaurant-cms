import { lazy, Suspense, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { HOME_SLUG, SITE_NAME } from '../lib/site.js'
import PageSections from './PageSections.jsx'

// The editing controls are admin UI built with Chakra, fetched only when an editor turns
// content editing on.
const ContentEditor = lazy(() => import('../admin/ContentEditor.jsx'))

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
      <Suspense fallback={<PageSections sections={sections} />}>
        <ContentEditor sections={sections} onChange={setSections} />
      </Suspense>
    )
  }

  return <PageSections sections={sections} />
}
