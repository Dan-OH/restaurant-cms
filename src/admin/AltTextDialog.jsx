import { useState } from 'react'
import { Button, CloseButton, Dialog } from '@chakra-ui/react'
import AdminPortal from './AdminPortal.jsx'
import AltTextField from './AltTextField.jsx'

// Edits an image's description on its own, from the button on the image while editing.
//
//   open, onClose
//   value      The current description.
//   onSave     Called with the new description (trimmed).
export default function AltTextDialog({ open, value, onClose, onSave }) {
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
            {/* Mounted fresh each time it opens, so it starts from the current description. */}
            <AltTextForm value={value} onClose={onClose} onSave={onSave} />
            <Dialog.CloseTrigger asChild>
              <CloseButton size="sm" />
            </Dialog.CloseTrigger>
          </Dialog.Content>
        </Dialog.Positioner>
      </AdminPortal>
    </Dialog.Root>
  )
}

function AltTextForm({ value, onClose, onSave }) {
  const [text, setText] = useState(value ?? '')

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        onSave(text.trim())
      }}
    >
      <Dialog.Header>
        <Dialog.Title>Image description</Dialog.Title>
      </Dialog.Header>
      <Dialog.Body>
        <AltTextField value={text} onChange={setText} autoFocus />
      </Dialog.Body>
      <Dialog.Footer>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit">Apply</Button>
      </Dialog.Footer>
    </form>
  )
}
