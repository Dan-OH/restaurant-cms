import { Box, Button, Center, Container, Flex, Heading, Spinner, Stack, Text } from '@chakra-ui/react'
import { Link, Navigate, Outlet, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import ExternalLinkButton from './ExternalLinkButton.jsx'
import { useAuth } from './useAuth.js'

// Shown at the left of the top bar; replace with the product name once there is one.
const PRODUCT_NAME = 'Site admin'

// A CSS length, because the sticky sidebar offsets itself by it.
const TOP_BAR_HEIGHT = '3.5rem'

// Sidebar links. To add a dashboard section, add an entry here and a matching <Route> in AdminApp.jsx.
const NAV_ITEMS = [{ label: 'Pages', to: '/admin/pages' }]

function SidebarLink({ item }) {
  const { pathname } = useLocation()
  const active = pathname === item.to || pathname.startsWith(`${item.to}/`)

  return (
    <Button asChild size="sm" variant={active ? 'subtle' : 'ghost'} justifyContent="flex-start">
      <Link to={item.to} aria-current={active ? 'page' : undefined}>
        {item.label}
      </Link>
    </Button>
  )
}

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
    <Flex minH="100vh" bg="bg.subtle" direction="column">
      <Flex
        as="header"
        align="center"
        justify="space-between"
        gap="4"
        flexShrink="0"
        h={TOP_BAR_HEIGHT}
        px="4"
        position="sticky"
        top="0"
        zIndex="docked"
        bg="bg"
        borderBottomWidth="1px"
      >
        <Heading size="md" px="3" asChild>
          <Link to="/admin">{PRODUCT_NAME}</Link>
        </Heading>
        <ExternalLinkButton href="/" variant="outline" size="sm">
          View site
        </ExternalLinkButton>
      </Flex>

      {/* Sidebar on the left from the md breakpoint up; stacked above the content on small screens. */}
      <Flex flex="1" direction={{ base: 'column', md: 'row' }}>
        <Flex
          as="aside"
          direction="column"
          gap="4"
          flexShrink="0"
          w={{ base: 'full', md: '60' }}
          h={{ md: `calc(100vh - ${TOP_BAR_HEIGHT})` }}
          position={{ md: 'sticky' }}
          top={TOP_BAR_HEIGHT}
          p="4"
          bg="bg"
          borderRightWidth={{ md: '1px' }}
          borderBottomWidth={{ base: '1px', md: '0' }}
        >
          <Flex as="nav" aria-label="Admin" direction={{ base: 'row', md: 'column' }} wrap="wrap" gap="1" flex="1">
            {NAV_ITEMS.map((item) => (
              <SidebarLink key={item.to} item={item} />
            ))}
          </Flex>

          <Stack gap="1" direction={{ base: 'row', md: 'column' }} align={{ base: 'center', md: 'stretch' }}>
            <Text fontSize="xs" color="fg.muted" px="3" truncate flex={{ base: '1', md: 'none' }}>
              {session.user.email}
            </Text>
            <Button variant="ghost" size="sm" justifyContent="flex-start" onClick={() => supabase.auth.signOut()}>
              Log out
            </Button>
          </Stack>
        </Flex>

        <Box as="main" flex="1" minW="0">
          <Container maxW="5xl" py="8">
            <Outlet />
          </Container>
        </Box>
      </Flex>
    </Flex>
  )
}
