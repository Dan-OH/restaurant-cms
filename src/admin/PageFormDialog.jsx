import { useId, useRef, useState } from 'react'
import { Alert, Button, CloseButton, Dialog, Field, Input, Portal, Stack, Switch } from '@chakra-ui/react'
import { supabase } from '../lib/supabase.js'
import { nextNavOrder, pagePaths, parentOf } from '../lib/pageTree.js'
import { HOME_SLUG, RESERVED_SLUGS, slugify } from '../lib/site.js'
import ParentGroupSelect from './ParentGroupSelect.jsx'

const EMPTY = { title: '', slug: '', published: true, show_in_nav: true, parent_id: '' }

// Modal for both creating a page (page = null) and editing an existing one.
// `pages` is every page and group, used for the group picker and to place new pages last.
export default function PageFormDialog({ open, page, pages, onClose, onSaved }) {
  const formId = useId()
  const titleRef = useRef(null)
  const [saving, setSaving] = useState(false)

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(e) => {
        if (!e.open && !saving) onClose()
      }}
      initialFocusEl={() => titleRef.current}
      // Unmounting on close means the form starts fresh every time it opens.
      lazyMount
      unmountOnExit
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>{page ? 'Edit page' : 'New page'}</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <PageFormFields
                formId={formId}
                titleRef={titleRef}
                page={page}
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
                {page ? 'Save changes' : 'Create page'}
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

function PageFormFields({ formId, titleRef, page, pages, setSaving, onSaved }) {
  const isNew = !page
  const [values, setValues] = useState(() =>
    page
      ? {
          title: page.title,
          slug: page.slug,
          published: page.published,
          show_in_nav: page.show_in_nav,
          parent_id: page.parent_id ?? '',
        }
      : EMPTY,
  )
  // For new pages the slug follows the title until the user edits the slug themselves.
  const [slugEdited, setSlugEdited] = useState(!isNew)
  const [error, setError] = useState('')

  function set(field, value) {
    setValues((current) => ({ ...current, [field]: value }))
  }

  function handleTitleChange(title) {
    setValues((current) => ({ ...current, title, slug: slugEdited ? current.slug : slugify(title) }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    const parentId = values.parent_id || null
    const row = {
      ...values,
      title: values.title.trim(),
      slug: slugify(values.slug),
      parent_id: parentId,
    }
    if (!row.title) return setError('Please enter a title.')
    if (!row.slug) return setError('Please enter a URL slug using letters or numbers.')
    if (!parentId && RESERVED_SLUGS.includes(row.slug)) return setError(`The slug "${row.slug}" is reserved.`)

    // New pages, and pages moved to a different group, go to the bottom of where they land.
    if (isNew || parentId !== parentOf(page)) row.nav_order = nextNavOrder(pages, parentId)

    setSaving(true)
    const query = isNew ? supabase.from('pages').insert(row) : supabase.from('pages').update(row).eq('id', page.id)
    const { error } = await query
    setSaving(false)

    if (error) {
      // 23505 = another item with the same parent already has this slug.
      setError(
        error.code === '23505'
          ? `Another page or group in the same place already uses the slug "${row.slug}".`
          : error.message,
      )
      return
    }
    onSaved()
  }

  // The address is the path of the chosen group followed by the slug.
  const groupPath = values.parent_id ? (pagePaths(pages).get(values.parent_id) ?? '') : ''
  const isHome = !values.parent_id && values.slug === HOME_SLUG

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
          <Field.Label>Title</Field.Label>
          <Input ref={titleRef} value={values.title} onChange={(e) => handleTitleChange(e.target.value)} />
          <Field.HelperText>Shown in the site navigation and the browser tab.</Field.HelperText>
        </Field.Root>

        <Field.Root required>
          <Field.Label>URL slug</Field.Label>
          <Input
            value={values.slug}
            onChange={(e) => {
              setSlugEdited(true)
              set('slug', e.target.value)
            }}
            onBlur={() => set('slug', slugify(values.slug))}
          />
          <Field.HelperText>
            {isHome
              ? 'This is the home page, shown at /'
              : `The page address will be ${groupPath}/${slugify(values.slug)}`}
          </Field.HelperText>
        </Field.Root>

        <ParentGroupSelect pages={pages} value={values.parent_id} onChange={(id) => set('parent_id', id)} />

        <Switch.Root checked={values.published} onCheckedChange={(e) => set('published', e.checked)}>
          <Switch.HiddenInput />
          <Switch.Control />
          <Switch.Label>Published (visible to visitors)</Switch.Label>
        </Switch.Root>

        <Switch.Root checked={values.show_in_nav} onCheckedChange={(e) => set('show_in_nav', e.checked)}>
          <Switch.HiddenInput />
          <Switch.Control />
          <Switch.Label>Show in navigation</Switch.Label>
        </Switch.Root>
      </Stack>
    </form>
  )
}
