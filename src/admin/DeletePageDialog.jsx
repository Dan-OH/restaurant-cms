import { useId, useRef, useState } from 'react'
import { Alert, Button, CloseButton, Dialog, Field, Input, Portal, Stack, Text } from '@chakra-ui/react'
import { supabase } from '../lib/supabase.js'

// Forgiving on purpose: ignores case and surrounding spaces, and pasting is fine.
function matches(typed, title) {
  return typed.trim().toLowerCase() === title.trim().toLowerCase()
}

// Confirms deleting a page by asking the user to type (or paste) its title.
export default function DeletePageDialog({ open, page, onClose, onDeleted }) {
  const formId = useId()
  const inputRef = useRef(null)
  const [typed, setTyped] = useState('')
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState(false)

  const confirmed = Boolean(page) && matches(typed, page.title)

  async function handleSubmit(event) {
    event.preventDefault()
    if (!confirmed) return
    setError('')
    setDeleting(true)
    const { error } = await supabase.from('pages').delete().eq('id', page.id)
    setDeleting(false)
    if (error) setError(error.message)
    else onDeleted()
  }

  return (
    <Dialog.Root
      role="alertdialog"
      open={open}
      onOpenChange={(e) => {
        if (!e.open && !deleting) onClose()
      }}
      onExitComplete={() => {
        setTyped('')
        setError('')
      }}
      initialFocusEl={() => inputRef.current}
      lazyMount
      unmountOnExit
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>Delete page</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <form id={formId} onSubmit={handleSubmit}>
                <Stack gap="4">
                  {error && (
                    <Alert.Root status="error">
                      <Alert.Indicator />
                      <Alert.Title>{error}</Alert.Title>
                    </Alert.Root>
                  )}
                  <Text>
                    This permanently deletes the page{' '}
                    <Text as="strong" fontWeight="semibold">
                      {page?.title}
                    </Text>{' '}
                    and removes it from the site. This cannot be undone.
                  </Text>
                  <Field.Root>
                    <Field.Label>Type the page name to confirm</Field.Label>
                    <Input
                      ref={inputRef}
                      value={typed}
                      placeholder={page?.title}
                      autoComplete="off"
                      onChange={(e) => setTyped(e.target.value)}
                    />
                  </Field.Root>
                </Stack>
              </form>
            </Dialog.Body>
            <Dialog.Footer>
              <Button variant="outline" onClick={onClose} disabled={deleting}>
                Cancel
              </Button>
              <Button type="submit" form={formId} colorPalette="red" disabled={!confirmed} loading={deleting}>
                Delete page
              </Button>
            </Dialog.Footer>
            <Dialog.CloseTrigger asChild>
              <CloseButton size="sm" />
            </Dialog.CloseTrigger>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  )
}
