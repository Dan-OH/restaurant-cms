import { ChakraProvider, defaultSystem } from '@chakra-ui/react'
import { Navigate, Route, Routes } from 'react-router-dom'
import AdminLayout from './AdminLayout.jsx'
import AssetsPage from './AssetsPage.jsx'
import LoginPage from './LoginPage.jsx'
import PagesList from './PagesList.jsx'
import RequireAuth from './RequireAuth.jsx'

// Mounted at /admin/* by App.jsx.
export default function AdminApp() {
  return (
    <ChakraProvider value={defaultSystem}>
      <Routes>
        <Route path="login" element={<LoginPage />} />
        <Route element={<RequireAuth />}>
          <Route element={<AdminLayout />}>
            <Route path="pages" element={<PagesList />} />
            <Route path="assets" element={<AssetsPage />} />
            {/* Pages is the landing section for now; unknown admin URLs go there too. */}
            <Route path="*" element={<Navigate to="/admin/pages" replace />} />
          </Route>
        </Route>
      </Routes>
    </ChakraProvider>
  )
}
