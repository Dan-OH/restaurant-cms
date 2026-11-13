import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { HOME_SLUG, SITE_NAME } from '../lib/site.js'

export default function SitePage() {
  const { pathname } = useLocation()
  const slug = pathname.replace(/^\/+|\/+$/g, '') || HOME_SLUG

  // { slug, page } so a result is never shown against a different URL.
  const [result, setResult] = useState(null)

  useEffect(() => {
    let cancelled = false
    supabase
      .from('pages')
      .select('id, title, slug')
      .eq('slug', slug)
      .eq('published', true)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) console.error('Could not load page', error)
        if (!cancelled) setResult({ slug, page: data ?? null })
      })
    return () => {
      cancelled = true
    }
  }, [slug])

  const loaded = result?.slug === slug
  const page = loaded ? result.page : null

  useEffect(() => {
    document.title = page && page.slug !== HOME_SLUG ? `${page.title} | ${SITE_NAME}` : SITE_NAME
  }, [page])

  if (!loaded) return null

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
