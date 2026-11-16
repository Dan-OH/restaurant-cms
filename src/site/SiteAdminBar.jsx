import { lazy, Suspense } from 'react'
import { useAuth } from '../auth/useAuth.js'

// The bar itself is admin UI built with Chakra. It is fetched only once we know someone is
// logged in, so visitors never download it.
const EditorBar = lazy(() => import('../admin/EditorBar.jsx'))

// Bar across the top of the public site, shown only to logged-in editors.
export default function SiteAdminBar() {
  const { session } = useAuth()
  if (!session) return null

  return (
    // The placeholder is the same height and colour as the bar, so the page doesn't jump
    // when the bar arrives.
    <Suspense fallback={<div className="site-admin-bar-placeholder" />}>
      <EditorBar />
    </Suspense>
  )
}
