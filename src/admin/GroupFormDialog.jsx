import { useId, useRef, useState } from 'react'
import { Alert, Button, CloseButton, Dialog, Field, Input, Stack } from '@chakra-ui/react'
import AdminPortal from './AdminPortal.jsx'
import { supabase } from '../lib/supabase.js'
import { nextNavOrder, pagePaths, parentOf } from '../lib/pageTree.js'
import { RESERVED_SLUGS, slugify } from '../lib/site.js'
import ParentGroupSelect from './ParentGroupSelect.jsx'

// Modal for creating a page group (group = null) or editing an existing one.
// `pages` is every page and group, used for the group picker and to place new groups last.
export default function GroupFormDialog({ open, group, pages, onClose, onSaved }) {
  const formId = useId()
  const nameRef = useRef(null)
  const [saving, setSaving] = useState(false)

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(e) => {
        if (!e.open && !saving) onClose()
      }}
      initialFocusEl={() => nameRef.current}
      // Unmounting on close means the form starts fresh every time it opens.
      lazyMount
      unmountOnExit
    >
      <AdminPortal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>{group ? 'Edit group' : 'New group'}</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <GroupFormFields
                formId={formId}
                nameRef={nameRef}
                group={group}
                pages={pages}
                setSaving={setSaving}
                onSaved={onSaved}
              />
            </Dialog.Body>
            <Dialog.Footer>
              <Button variant="outline" onClick={onClose} disabled={saving}>
                Cancel
              </Button>
              <Button type="submit" form={formId} loading={saving}>
                {group ? 'Save changes' : 'Create group'}
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

function GroupFormFields({ formId, nameRef, group, pages, setSaving, onSaved }) {
  const isNew = !group
  const [name, setName] = useState(group?.title ?? '')
  const [slug, setSlug] = useState(group?.slug ?? '')
  // For new groups the slug follows the name until the user edits the slug themselves.
  const [slugEdited, setSlugEdited] = useState(!isNew)
  const [parentValue, setParentValue] = useState(group?.parent_id ?? '')
  const [error, setError] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    const parentId = parentValue || null
    const row = { title: name.trim(), slug: slugify(slug), parent_id: parentId }
    if (!row.title) return setError('Please enter a name.')
    if (!row.slug) return setError('Please enter a URL slug using letters or numbers.')
    if (!parentId && RESERVED_SLUGS.includes(row.slug)) return setError(`The slug "${row.slug}" is reserved.`)

    // New groups, and groups moved into a different group, go to the bottom of where they land.
    if (isNew || parentId !== parentOf(group)) row.nav_order = nextNavOrder(pages, parentId)

    setSaving(true)
    const query = isNew
      ? supabase.from('pages').insert({ ...row, kind: 'group' })
      : supabase.from('pages').update(row).eq('id', group.id)
    const { error } = await query
    setSaving(false)

    if (!error) return onSaved()
    // 23505 = another item with the same parent already has this slug.
    setError(
      error.code === '23505'
        ? `Another page or group in the same place already uses the slug "${row.slug}".`
        : error.message,
    )
  }

  // Everything in the group gets this path in front of its own slug.
  const parentPath = parentValue ? (pagePaths(pages).get(parentValue) ?? '') : ''
  const groupPath = `${parentPath}/${slugify(slug)}`

  return (
    <form id={formId} onSubmit={handleSubmit}>
      <Stack gap="5">
        {error && (
          <Alert.Root status="error">
            <Alert.Indicator />
            <Alert.Title>{error}</Alert.Title>
          </Alert.Root>
        )}

        <Field.Root required>
          <Field.Label>Name</Field.Label>
          <Input
            ref={nameRef}
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              if (!slugEdited) setSlug(slugify(e.target.value))
            }}
          />
          <Field.HelperText>
            Shown in the site navigation as a dropdown that opens to reveal the pages inside it.
          </Field.HelperText>
        </Field.Root>

        <Field.Root required>
          <Field.Label>URL slug</Field.Label>
          <Input
            value={slug}
            onChange={(e) => {
              setSlugEdited(true)
              setSlug(e.target.value)
            }}
            onBlur={() => setSlug(slugify(slug))}
          />
          <Field.HelperText>
            Pages in this group will have addresses starting with {groupPath}/
            {!isNew && ' — changing this changes the address of every page inside the group.'}
          </Field.HelperText>
        </Field.Root>

        {/* A group can't be placed inside itself or anything it contains. */}
        <ParentGroupSelect pages={pages} excludeId={group?.id} value={parentValue} onChange={setParentValue} />
      </Stack>
    </form>
  )
}
