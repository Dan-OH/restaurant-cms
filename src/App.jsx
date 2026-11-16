import { lazy, Suspense } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth/AuthProvider.jsx'
import { supabase } from './lib/supabase.js'
import SiteLayout from './site/SiteLayout.jsx'
import SitePage from './site/SitePage.jsx'

// Loaded on demand so visitors to the public site never download the CMS or Chakra UI.
const AdminApp = lazy(() => import('./admin/AdminApp.jsx'))

export default function App() {
  if (!supabase) {
    return (
      <div style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 560, margin: '80px auto', padding: 16 }}>
        <h1>Supabase is not configured</h1>
        <p>
          Copy <code>.env.example</code> to <code>.env.local</code>, fill in your project URL and
          publishable key, then restart <code>npm run dev</code>.
        </p>
      </div>
    )
  }

  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route
            path="/admin/*"
            element={
              <Suspense fallback={null}>
                <AdminApp />
              </Suspense>
            }
          />
          <Route element={<SiteLayout />}>
            <Route index element={<SitePage />} />
            <Route path=":slug" element={<SitePage />} />
            <Route path="*" element={<SitePage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
