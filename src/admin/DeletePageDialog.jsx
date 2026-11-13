import { useId, useRef, useState } from 'react'
import { Alert, Button, CloseButton, Dialog, Field, Input, Portal, Stack, Text } from '@chakra-ui/react'
import { supabase } from '../lib/supabase.js'
import { nextNavOrder, parentOf } from '../lib/pageTree.js'

// Forgiving on purpose: ignores case and surrounding spaces, and pasting is fine.
function matches(typed, title) {
  return typed.trim().toLowerCase() === title.trim().toLowerCase()
}

// Confirms deleting a page or a group (`item`). `pages` is every page and group.
//
// - A page is gone for good, so the user has to type (or paste) its title first.
// - Deleting a group keeps what is inside it: the contents move up to where the group was.
//   Nothing is lost, so a plain confirmation is enough.
export default function DeletePageDialog({ open, item, pages, onClose, onDeleted }) {
  const formId = useId()
  const inputRef = useRef(null)
  const [typed, setTyped] = useState('')
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState(false)

  const isGroup = item?.kind === 'group'
  const children = isGroup ? pages.filter((row) => row.parent_id === item.id) : []
  const confirmed = Boolean(item) && (isGroup || matches(typed, item.title))

  async function deleteItem() {
    if (isGroup && children.length > 0) {
      // Move the contents to the end of the group's own parent, keeping their order.
      const newParent = parentOf(item)
      const firstOrder = nextNavOrder(pages, newParent)
      const ordered = [...children].sort((a, b) => a.nav_order - b.nav_order)
      const results = await Promise.all(
        ordered.map((child, index) =>
          supabase
            .from('pages')
            .update({ parent_id: newParent, nav_order: firstOrder + index })
            .eq('id', child.id),
        ),
      )
      const failed = results.find((result) => result.error)
      if (failed) return failed.error
    }
    const { error } = await supabase.from('pages').delete().eq('id', item.id)
    return error
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (!confirmed) return
    setError('')
    setDeleting(true)
    const error = await deleteItem()
    setDeleting(false)
    if (!error) return onDeleted()
    // 23505 = something moving out of the group has the same URL slug as an item already there.
    setError(
      error.code === '23505'
        ? 'This group can’t be deleted yet: something inside it has the same URL slug as an item it would sit next to. Change one of the slugs, or move the item elsewhere, then try again.'
        : error.message,
    )
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
              <Dialog.Title>{isGroup ? 'Delete group' : 'Delete page'}</Dialog.Title>
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
                  {isGroup ? (
                    <Text>
                      This deletes the group{' '}
                      <Text as="strong" fontWeight="semibold">
                        {item?.title}
                      </Text>{' '}
                      and removes its dropdown from the site navigation.{' '}
                      {children.length > 0
                        ? 'The pages and groups inside it are kept and move up to where the group was.'
                        : 'The group is empty, so no pages are affected.'}
                    </Text>
                  ) : (
                    <>
                      <Text>
                        This permanently deletes the page{' '}
                        <Text as="strong" fontWeight="semibold">
                          {item?.title}
                        </Text>{' '}
                        and removes it from the site. This cannot be undone.
                      </Text>
                      <Field.Root>
                        <Field.Label>Type the page name to confirm</Field.Label>
                        <Input
                          ref={inputRef}
                          value={typed}
                          placeholder={item?.title}
                          autoComplete="off"
                          onChange={(e) => setTyped(e.target.value)}
                        />
                      </Field.Root>
                    </>
                  )}
                </Stack>
              </form>
            </Dialog.Body>
            <Dialog.Footer>
              <Button variant="outline" onClick={onClose} disabled={deleting}>
                Cancel
              </Button>
              <Button type="submit" form={formId} colorPalette="red" disabled={!confirmed} loading={deleting}>
                {isGroup ? 'Delete group' : 'Delete page'}
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
