import { Box, Button, Center, Container, Flex, Heading, HStack, Spinner, Text } from '@chakra-ui/react'
import { Link, Navigate, Outlet, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { useAuth } from './useAuth.js'

// Shell for every logged-in CMS screen; redirects to the login page otherwise.
export default function AdminLayout() {
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

  return (
    <Box minH="100vh" bg="bg.subtle">
      <Box as="header" bg="bg" borderBottomWidth="1px">
        <Container maxW="5xl">
          <Flex h="16" align="center" justify="space-between" gap="4">
            <Heading size="md" asChild>
              <Link to="/admin">Site admin</Link>
            </Heading>
            <HStack gap="3">
              <Text fontSize="sm" color="fg.muted" hideBelow="md">
                {session.user.email}
              </Text>
              <Button asChild variant="ghost" size="sm">
                <a href="/" target="_blank" rel="noreferrer">
                  View site
                </a>
              </Button>
              <Button variant="outline" size="sm" onClick={() => supabase.auth.signOut()}>
                Log out
              </Button>
            </HStack>
          </Flex>
        </Container>
      </Box>
      <Container maxW="5xl" py="8">
        <Outlet />
      </Container>
    </Box>
  )
}
