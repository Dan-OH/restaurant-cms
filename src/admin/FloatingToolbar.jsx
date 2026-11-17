import { Box, Button, HStack } from '@chakra-ui/react'
import { EMBED_CLASS } from './embeddedSystem.js'

// How far from the top of the screen the toolbar stops when following a long text: clear of
// the editor bar (2.5rem, see EditorBar.jsx) plus the toolbar's own height and a little air.
const STICKY_TOP = '5.75rem'

// A small toolbar that floats just above whatever is being typed into. Place it directly
// before that content and show it only while the content has the cursor.
//
// The wrapper has no height, so it takes up no room in the page; the toolbar hangs upwards
// from it. Being "sticky", it also follows the top of the screen when the content is longer
// than the window, so the buttons stay in reach.
export default function FloatingToolbar({ label, children }) {
  return (
    <Box className={EMBED_CLASS} position="sticky" top={STICKY_TOP} h="0" zIndex="10">
      <Box position="absolute" bottom="2" left="0" p="1" bg="bg" borderWidth="1px" borderRadius="md" shadow="md">
        <HStack gap="1" role="toolbar" aria-label={label}>
          {children}
        </HStack>
      </Box>
    </Box>
  )
}

// One button in a FloatingToolbar. `active` highlights it, e.g. for the current style.
export function ToolbarButton({ label, active, onClick, children }) {
  return (
    <Button
      size="xs"
      minW="7"
      px="2"
      variant={active ? 'solid' : 'ghost'}
      aria-label={label}
      aria-pressed={active}
      title={label}
      // Keep the cursor (and so this toolbar) in the text when a button is pressed with the mouse.
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
    >
      {children}
    </Button>
  )
}
