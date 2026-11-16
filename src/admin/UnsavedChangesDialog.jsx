import { Button, CloseButton, Dialog, Text } from '@chakra-ui/react'
import AdminPortal from './AdminPortal.jsx'
import FaIcon from './FaIcon.jsx'

// Shown when an editor tries to leave content editing with changes they haven't saved.
//
//   onCancel   Stay and keep editing.
//   onDiscard  Leave and throw the changes away.
//   onSave     Save, then leave. `saving` is true while that is in progress.
export default function UnsavedChangesDialog({ open, saving, onCancel, onDiscard, onSave }) {
  return (
    <Dialog.Root
      role="alertdialog"
      open={open}
      onOpenChange={(e) => {
        if (!e.open && !saving) onCancel()
      }}
      lazyMount
      unmountOnExit
    >
      <AdminPortal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>Unsaved changes</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <Text>
                You have changes to this page that haven’t been saved. If you leave without saving, they will be
                lost.
              </Text>
            </Dialog.Body>
            <Dialog.Footer flexWrap="wrap">
              <Button variant="outline" onClick={onCancel} disabled={saving}>
                Keep editing
              </Button>
              <Button variant="outline" colorPalette="red" onClick={onDiscard} disabled={saving}>
                Discard changes
                {/* f2ed = trash can */}
                <FaIcon code="f2ed" />
              </Button>
              <Button onClick={onSave} loading={saving}>
                Save changes
                {/* f0c7 = floppy disk */}
                <FaIcon code="f0c7" />
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
