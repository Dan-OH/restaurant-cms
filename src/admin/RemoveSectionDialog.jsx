import { Button, CloseButton, Dialog, Text } from '@chakra-ui/react'
import AdminPortal from './AdminPortal.jsx'
import FaIcon from './FaIcon.jsx'

// Asks before removing a section from the page being edited. `label` is the kind of
// section, e.g. "Text". `hasImages` adds a note that its images get deleted too.
export default function RemoveSectionDialog({ open, label, hasImages, onClose, onConfirm }) {
  return (
    <Dialog.Root
      role="alertdialog"
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
              <Dialog.Title>Remove section</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <Text>
                This removes the{' '}
                <Text as="strong" fontWeight="semibold">
                  {label}
                </Text>{' '}
                section and everything in it from the page. This cannot be undone.
              </Text>
              {hasImages && (
                <Text mt="3">
                  Its image will also be deleted from the site’s assets when you save, unless another page uses
                  it.
                </Text>
              )}
            </Dialog.Body>
            <Dialog.Footer>
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button colorPalette="red" onClick={onConfirm}>
                Remove section
                {/* f2ed = trash can */}
                <FaIcon code="f2ed" />
              </Button>
            </Dialog.Footer>
            <Dialog.CloseTrigger asChild>
              <CloseButton size="sm" />
            </Dialog.CloseTrigger>
          </Dialog.Content>
        </Dialog.Positioner>
      </AdminPortal>
    </Dialog.Root>
  )
}
