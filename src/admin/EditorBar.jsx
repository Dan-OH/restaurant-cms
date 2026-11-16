import { useState } from 'react'
import { Badge, Box, Button, ChakraProvider, Flex, Text } from '@chakra-ui/react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/useAuth.js'
import { supabase } from '../lib/supabase.js'
import { EMBED_CLASS, embeddedSystem } from './embeddedSystem.js'
import FaIcon from './FaIcon.jsx'
import PageFormDialog from './PageFormDialog.jsx'
import { PortalContainerContext } from './portalContainer.js'

// Keep in sync with the placeholder in src/site/site.css, which holds this space while
// this file is downloading.
export const EDITOR_BAR_HEIGHT = '2.5rem'

// The bar shown above the public site to logged-in editors. While a page's content is being
// edited (which happens on the page itself, see ContentEditor.jsx) it shows the save state
// and the Save and Done buttons. Loaded on demand by src/site/SiteAdminBar.jsx, so visitors
// never download it or Chakra.
//
// - page: the page being viewed, or null (e.g. on a "not found" address).
// - pages: every page and group, needed by the page details dialog.
// - onPageSaved(page): called after the page's details are edited, so the site can refresh.
// - content: the page's sections and editing state, from usePageSections, plus start() and
//   stop() to enter and leave content editing.
export default function EditorBar({ page, pages, onPageSaved, content }) {
  const { session } = useAuth()
  // Keeps its own copy of the page while open, so the dialog doesn't change under the user
  // if the site re-renders, or flip to "New page" while it is closing.
  const [dialog, setDialog] = useState({ open: false, page: null })
  // The element dialogs are rendered into. See portalContainer.js.
  const [portalContainer, setPortalContainer] = useState(null)

  if (!session) return null

  return (
    <ChakraProvider value={embeddedSystem}>
      <PortalContainerContext.Provider value={portalContainer}>
        {/* "dark" switches Chakra's colours to their dark variants for everything inside. */}
        <Box className={`${EMBED_CLASS} dark`} position="sticky" top="0" zIndex="sticky">
          <Flex as="aside" aria-label="Editor" align="center" gap="2" minH={EDITOR_BAR_HEIGHT} px="4" bg="bg.muted">
            <Button asChild size="xs" variant="ghost">
              <Link to="/admin">Dashboard</Link>
            </Button>

            {content.editing ? (
              <>
                <Text
                  flex="1"
                  minW="0"
                  fontSize="xs"
                  color={content.error ? 'fg.error' : 'fg.muted'}
                  truncate
                  title={content.error || undefined}
                  aria-live="polite"
                >
                  {content.error || `Editing content · ${content.dirty ? 'Unsaved changes' : 'All changes saved'}`}
                </Text>
                <Button size="xs" variant="solid" disabled={!content.dirty} loading={content.saving} onClick={content.save}>
                  Save
                  {/* f0c7 = floppy disk */}
                  <FaIcon code="f0c7" />
                </Button>
                <Button size="xs" variant="ghost" onClick={content.stop}>
                  Done
                  {/* f00c = check */}
                  <FaIcon code="f00c" />
                </Button>
              </>
            ) : (
              <>
                {page && (
                  <Button size="xs" variant="ghost" onClick={content.start}>
                    Edit content
                    {/* f15c = file with lines */}
                    <FaIcon code="f15c" />
                  </Button>
                )}
                {page && (
                  <Button size="xs" variant="ghost" onClick={() => setDialog({ open: true, page })}>
                    Edit page
                    {/* f303 = pencil */}
                    <FaIcon code="f303" />
                  </Button>
                )}
                {page && !page.published && (
                  <Badge colorPalette="yellow" title="Only logged-in editors can see this page">
                    Draft
                  </Badge>
                )}
                <Text flex="1" minW="0" textAlign="right" fontSize="xs" color="fg.muted" truncate hideBelow="sm">
                  {session.user.email}
                </Text>
                <Button size="xs" variant="ghost" ml={{ base: 'auto', sm: '0' }} onClick={() => supabase.auth.signOut()}>
                  Log out
                  {/* f2f5 = right-from-bracket, the same icon as the dashboard's log out button */}
                  <FaIcon code="f2f5" />
                </Button>
              </>
            )}
          </Flex>
        </Box>

        {/* Dialogs render in here: inside the embedded styles, but outside the bar's dark
            colours, so they look the same as they do in the dashboard. See portalContainer.js. */}
        <div className={EMBED_CLASS} ref={setPortalContainer} />

        <PageFormDialog
          open={dialog.open}
          page={dialog.page}
          pages={pages}
          onClose={() => setDialog((current) => ({ ...current, open: false }))}
          onSaved={() => {
            setDialog((current) => ({ ...current, open: false }))
            onPageSaved(dialog.page)
          }}
        />
      </PortalContainerContext.Provider>
    </ChakraProvider>
  )
}
