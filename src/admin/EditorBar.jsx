import { Button, ChakraProvider, Flex, Text } from '@chakra-ui/react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/useAuth.js'
import { supabase } from '../lib/supabase.js'
import { EMBED_CLASS, embeddedSystem } from './embeddedSystem.js'
import FaIcon from './FaIcon.jsx'

// Keep in sync with the placeholder in src/site/SiteAdminBar.jsx, which holds this space
// while this file is downloading.
export const EDITOR_BAR_HEIGHT = '2.5rem'

// The bar shown above the public site to logged-in editors. Loaded on demand by
// src/site/SiteAdminBar.jsx, so visitors never download it or Chakra.
export default function EditorBar() {
  const { session } = useAuth()
  if (!session) return null

  return (
    <ChakraProvider value={embeddedSystem}>
      {/* "dark" switches Chakra's colours to their dark variants for everything inside. */}
      <div className={`${EMBED_CLASS} dark`}>
        <Flex as="aside" aria-label="Editor" align="center" gap="2" minH={EDITOR_BAR_HEIGHT} px="4" bg="bg.muted">
          <Button asChild size="xs" variant="ghost">
            <Link to="/admin">Dashboard</Link>
          </Button>
          <Text flex="1" minW="0" textAlign="right" fontSize="xs" color="fg.muted" truncate hideBelow="sm">
            {session.user.email}
          </Text>
          <Button size="xs" variant="ghost" ml={{ base: 'auto', sm: '0' }} onClick={() => supabase.auth.signOut()}>
            Log out
            {/* f2f5 = right-from-bracket, the same icon as the dashboard's log out button */}
            <FaIcon code="f2f5" />
          </Button>
        </Flex>
      </div>
    </ChakraProvider>
  )
}
