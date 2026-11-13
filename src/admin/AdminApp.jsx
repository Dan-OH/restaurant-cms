import { ChakraProvider, defaultSystem } from '@chakra-ui/react'
import { Route, Routes } from 'react-router-dom'
import { AuthProvider } from './AuthProvider.jsx'
import AdminLayout from './AdminLayout.jsx'
import LoginPage from './LoginPage.jsx'
import PagesList from './PagesList.jsx'

// Mounted at /admin/* by App.jsx.
export default function AdminApp() {
  return (
    <ChakraProvider value={defaultSystem}>
      <AuthProvider>
        <Routes>
          <Route path="login" element={<LoginPage />} />
          <Route element={<AdminLayout />}>
            <Route index element={<PagesList />} />
            <Route path="*" element={<PagesList />} />
          </Route>
        </Routes>
      </AuthProvider>
    </ChakraProvider>
  )
}
