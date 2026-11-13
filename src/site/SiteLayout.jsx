import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { LOGO_SRC, SITE_NAME, pagePath } from '../lib/site.js'
import './site.css'

export default function SiteLayout() {
  const [navPages, setNavPages] = useState([])

  useEffect(() => {
    let cancelled = false
    supabase
      .from('pages')
      .select('id, title, slug')
      .eq('published', true)
      .eq('show_in_nav', true)
      .order('nav_order')
      .order('title')
      .then(({ data, error }) => {
        if (error) console.error('Could not load navigation', error)
        if (!cancelled) setNavPages(data ?? [])
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="site">
      <header className="site-header">
        <Link to="/" className="site-logo">
          <img src={LOGO_SRC} alt="" width="40" height="40" />
          <span>{SITE_NAME}</span>
        </Link>
        <nav className="site-nav" aria-label="Main">
          {navPages.map((page) => (
            <NavLink key={page.id} to={pagePath(page.slug)} end>
              {page.title}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="site-main">
        <Outlet />
      </main>
    </div>
  )
}
