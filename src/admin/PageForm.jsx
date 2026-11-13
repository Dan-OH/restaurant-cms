import { useEffect, useState } from 'react'
import { Alert, Box, Button, Center, Field, Heading, HStack, Input, Spinner, Stack, Switch } from '@chakra-ui/react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { HOME_SLUG, RESERVED_SLUGS, slugify } from '../lib/site.js'

const EMPTY = { title: '', slug: '', published: true, show_in_nav: true, nav_order: 0 }

// Used for both "New page" (/admin/pages/new) and "Edit page" (/admin/pages/:id).
export default function PageForm() {
  const { id } = useParams()
  const isNew = !id
  const navigate = useNavigate()

  const [values, setValues] = useState(isNew ? EMPTY : null)
  // For new pages the slug follows the title until the user edits the slug themselves.
  const [slugEdited, setSlugEdited] = useState(!isNew)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (isNew) return
    let cancelled = false
    supabase
      .from('pages')
      .select('title, slug, published, show_in_nav, nav_order')
      .eq('id', id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) setError(error.message)
        else if (!data) setError('This page no longer exists.')
        else setValues(data)
      })
    return () => {
      cancelled = true
    }
  }, [id, isNew])

  function set(field, value) {
    setValues((current) => ({ ...current, [field]: value }))
  }

  function handleTitleChange(title) {
    setValues((current) => ({ ...current, title, slug: slugEdited ? current.slug : slugify(title) }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    const row = {
      ...values,
      title: values.title.trim(),
      slug: slugify(values.slug),
      nav_order: Number.parseInt(values.nav_order, 10) || 0,
    }
    if (!row.title) return setError('Please enter a title.')
    if (!row.slug) return setError('Please enter a URL slug using letters or numbers.')
    if (RESERVED_SLUGS.includes(row.slug)) return setError(`The slug "${row.slug}" is reserved.`)

    setSaving(true)
    const query = isNew ? supabase.from('pages').insert(row) : supabase.from('pages').update(row).eq('id', id)
    const { error } = await query
    setSaving(false)

    if (error) {
      // 23505 = unique violation on the slug column.
      setError(error.code === '23505' ? `Another page already uses the slug "${row.slug}".` : error.message)
      return
    }
    navigate('/admin')
  }

  return (
    <Box maxW="xl">
      <Heading size="2xl" mb="6">
        {isNew ? 'New page' : 'Edit page'}
      </Heading>

      {error && (
        <Alert.Root status="error" mb="4">
          <Alert.Indicator />
          <Alert.Title>{error}</Alert.Title>
        </Alert.Root>
      )}

      {!values && !error && (
        <Center py="16">
          <Spinner />
        </Center>
      )}

      {!values && error && (
        <Button asChild variant="outline">
          <Link to="/admin">Back to pages</Link>
        </Button>
      )}

      {values && (
        <Box as="form" onSubmit={handleSubmit} bg="bg" borderWidth="1px" borderRadius="lg" p="6">
          <Stack gap="5">
            <Field.Root required>
              <Field.Label>Title</Field.Label>
              <Input value={values.title} autoFocus={isNew} onChange={(e) => handleTitleChange(e.target.value)} />
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
                {values.slug === HOME_SLUG
                  ? 'This is the home page, shown at /'
                  : `The page address will be /${slugify(values.slug)}. Use "${HOME_SLUG}" for the home page.`}
              </Field.HelperText>
            </Field.Root>

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

            {values.show_in_nav && (
              <Field.Root>
                <Field.Label>Navigation order</Field.Label>
                <Input
                  type="number"
                  maxW="32"
                  value={values.nav_order}
                  onChange={(e) => set('nav_order', e.target.value)}
                />
                <Field.HelperText>Lower numbers appear first.</Field.HelperText>
              </Field.Root>
            )}

            <HStack gap="3" pt="2">
              <Button type="submit" loading={saving}>
                {isNew ? 'Create page' : 'Save changes'}
              </Button>
              <Button asChild variant="ghost">
                <Link to="/admin">Cancel</Link>
              </Button>
            </HStack>
          </Stack>
        </Box>
      )}
    </Box>
  )
}
