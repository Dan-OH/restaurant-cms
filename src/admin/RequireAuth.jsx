import { Center, Spinner } from '@chakra-ui/react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/useAuth.js'

// Wraps every admin route that needs a login; sends everyone else to the login page,
// remembering where they were headed.
export default function RequireAuth() {
  const { session, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <Center minH="100vh">
        <Spinner />
      </Center>
    )
  }

  if (!session) {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}
