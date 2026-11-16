import { useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { HOME_SLUG, SITE_NAME } from '../lib/site.js'

export default function SitePage() {
  // SiteLayout loads the pages and works out which one the current URL points at.
  const { loading, page } = useOutletContext()

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

  // Pages are intentionally blank for now; page content will render here.
  return null
}
