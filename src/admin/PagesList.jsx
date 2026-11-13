import { useCallback, useEffect, useState } from 'react'
import { Alert, Badge, Box, Button, Center, Flex, Heading, HStack, Spinner, Table, Text } from '@chakra-ui/react'
import { supabase } from '../lib/supabase.js'
import { pagePath } from '../lib/site.js'
import DeletePageDialog from './DeletePageDialog.jsx'
import PageFormDialog from './PageFormDialog.jsx'

export default function PagesList() {
  const [pages, setPages] = useState(null)
  const [error, setError] = useState('')
  // page = null means the dialog is creating a new page.
  const [dialog, setDialog] = useState({ open: false, page: null })
  const [deleteDialog, setDeleteDialog] = useState({ open: false, page: null })

  const load = useCallback(
    () =>
      supabase
        .from('pages')
        .select('*')
        .order('nav_order')
        .order('title')
        .then(({ data, error }) => {
          if (error) setError(error.message)
          else setPages(data)
        }),
    [],
  )

  useEffect(() => {
    load()
  }, [load])

  return (
    <Box>
      <Flex justify="space-between" align="center" mb="6">
        <Heading size="2xl">Pages</Heading>
        <Button onClick={() => setDialog({ open: true, page: null })}>New page</Button>
      </Flex>

      {error && (
        <Alert.Root status="error" mb="4">
          <Alert.Indicator />
          <Alert.Title>{error}</Alert.Title>
        </Alert.Root>
      )}

      {!pages && !error && (
        <Center py="16">
          <Spinner />
        </Center>
      )}

      {pages?.length === 0 && (
        <Box bg="bg" borderWidth="1px" borderRadius="lg" p="10" textAlign="center">
          <Text color="fg.muted">No pages yet. Create the first one with “New page”.</Text>
        </Box>
      )}

      {pages?.length > 0 && (
        <Box bg="bg" borderWidth="1px" borderRadius="lg" overflowX="auto">
          <Table.Root>
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader>Title</Table.ColumnHeader>
                <Table.ColumnHeader>URL</Table.ColumnHeader>
                <Table.ColumnHeader>Status</Table.ColumnHeader>
                <Table.ColumnHeader>Navigation</Table.ColumnHeader>
                <Table.ColumnHeader />
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {pages.map((page) => (
                <Table.Row key={page.id}>
                  <Table.Cell fontWeight="medium">{page.title}</Table.Cell>
                  <Table.Cell color="fg.muted">{pagePath(page.slug)}</Table.Cell>
                  <Table.Cell>
                    {page.published ? <Badge colorPalette="green">Published</Badge> : <Badge>Draft</Badge>}
                  </Table.Cell>
                  <Table.Cell color="fg.muted">
                    {page.show_in_nav ? `Shown (order ${page.nav_order})` : 'Hidden'}
                  </Table.Cell>
                  <Table.Cell>
                    <HStack justify="flex-end" gap="2">
                      {page.published && (
                        <Button asChild size="sm" variant="ghost">
                          <a href={pagePath(page.slug)} target="_blank" rel="noreferrer">
                            View
                          </a>
                        </Button>
                      )}
                      <Button size="sm" variant="outline" onClick={() => setDialog({ open: true, page })}>
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        colorPalette="red"
                        onClick={() => setDeleteDialog({ open: true, page })}
                      >
                        Delete
                      </Button>
                    </HStack>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        </Box>
      )}

      <PageFormDialog
        open={dialog.open}
        page={dialog.page}
        // Keep `page` while closing so the title doesn't flip during the exit animation.
        onClose={() => setDialog((current) => ({ ...current, open: false }))}
        onSaved={() => {
          setDialog((current) => ({ ...current, open: false }))
          load()
        }}
      />

      <DeletePageDialog
        open={deleteDialog.open}
        page={deleteDialog.page}
        onClose={() => setDeleteDialog((current) => ({ ...current, open: false }))}
        onDeleted={() => {
          setDeleteDialog((current) => ({ ...current, open: false }))
          load()
        }}
      />
    </Box>
  )
}
