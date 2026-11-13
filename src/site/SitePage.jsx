import { useEffect } from 'react'
import { useLocation, useOutletContext } from 'react-router-dom'
import { HOME_SLUG, SITE_NAME } from '../lib/site.js'

export default function SitePage() {
  const { pathname } = useLocation()
  // Every published page and group, and their addresses, loaded once by SiteLayout.
  const { rows, paths } = useOutletContext()

  // "/menus/lunch/" and "/menus/lunch" are the same page.
  const path = pathname.replace(/\/+$/, '') || '/'
  // Only pages have an address of their own; a group's path on its own is not a page.
  const page = rows?.find((row) => row.kind !== 'group' && paths.get(row.id) === path) ?? null

  useEffect(() => {
    const isHome = page?.slug === HOME_SLUG && page.parent_id == null
    document.title = page && !isHome ? `${page.title} | ${SITE_NAME}` : SITE_NAME
  }, [page])

  if (!rows) return null

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
