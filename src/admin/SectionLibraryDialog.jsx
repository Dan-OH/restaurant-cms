import { Box, CloseButton, Dialog, Stack, Text } from '@chakra-ui/react'
import { SECTION_TYPES } from '../sections/index.js'
import AdminPortal from './AdminPortal.jsx'

// The section library: lists every kind of section defined in src/sections/.
// Picking one calls onPick with its definition.
export default function SectionLibraryDialog({ open, onClose, onPick }) {
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(e) => {
        if (!e.open) onClose()
      }}
      lazyMount
      unmountOnExit
    >
      <AdminPortal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>Add a section</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body pb="6">
              <Stack gap="3">
                {SECTION_TYPES.map((definition) => (
                  <Box
                    as="button"
                    type="button"
                    key={definition.type}
                    w="full"
                    p="4"
                    textAlign="left"
                    borderWidth="1px"
                    borderRadius="lg"
                    cursor="pointer"
                    _hover={{ bg: 'bg.muted', borderColor: 'border.emphasized' }}
                    onClick={() => onPick(definition)}
                  >
                    <Text fontWeight="medium">{definition.label}</Text>
                    <Text fontSize="sm" color="fg.muted">
                      {definition.description}
                    </Text>
                  </Box>
                ))}
              </Stack>
            </Dialog.Body>
            <Dialog.CloseTrigger asChild>
              <CloseButton size="sm" />
            </Dialog.CloseTrigger>
          </Dialog.Content>
        </Dialog.Positioner>
      </AdminPortal>
    </Dialog.Root>
  )
}
