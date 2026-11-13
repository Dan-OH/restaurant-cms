import { useCallback, useEffect, useRef, useState } from 'react'
import { Alert, Badge, Box, Button, Center, Flex, Heading, HStack, Spinner, Text } from '@chakra-ui/react'
import { supabase } from '../lib/supabase.js'
import { pagePath } from '../lib/site.js'
import DeletePageDialog from './DeletePageDialog.jsx'
import PageFormDialog from './PageFormDialog.jsx'

// Shared by the header and every row so the columns line up:
// handle | title | URL | status | navigation | actions
const COLUMNS = '1.5rem minmax(8rem, 1.5fr) minmax(6rem, 1fr) 6rem 6rem 14rem'

// Space between rows, and the drop line that sits centred in it.
const ROW_GAP = '0.5rem'
const DROP_LINE_HEIGHT = '2px'
const DROP_LINE_OFFSET = `calc((${ROW_GAP} + ${DROP_LINE_HEIGHT}) / -2)`

export default function PagesList() {
  const [pages, setPages] = useState(null)
  const [error, setError] = useState('')
  // page = null means the dialog is creating a new page.
  const [dialog, setDialog] = useState({ open: false, page: null })
  const [deleteDialog, setDeleteDialog] = useState({ open: false, page: null })

  // Drag state: the row being dragged, and the gap it would be dropped into
  // (0 = above the first row, pages.length = below the last row).
  const [dragIndex, setDragIndex] = useState(null)
  const [dropIndex, setDropIndex] = useState(null)
  const rowRefs = useRef(new Map())

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

  // Moves the page at `from` into the gap `to` and saves the new order.
  async function reorder(from, to) {
    // Dropping into the gap directly above or below itself changes nothing.
    if (to === from || to === from + 1) return

    const moved = [...pages]
    const [page] = moved.splice(from, 1)
    moved.splice(to > from ? to - 1 : to, 0, page)

    const reordered = moved.map((p, index) => ({ ...p, nav_order: index }))
    const changed = reordered.filter((p) => pages.find((old) => old.id === p.id).nav_order !== p.nav_order)

    setError('')
    setPages(reordered)

    const results = await Promise.all(
      changed.map((p) => supabase.from('pages').update({ nav_order: p.nav_order }).eq('id', p.id)),
    )
    const failed = results.find((result) => result.error)
    if (failed) {
      setError(`Could not save the new order: ${failed.error.message}`)
      load()
    }
  }

  function endDrag() {
    setDragIndex(null)
    setDropIndex(null)
  }

  function handleDragStart(event, index) {
    const row = rowRefs.current.get(pages[index].id)
    event.dataTransfer.effectAllowed = 'move'
    // Firefox only starts a drag when some data is set.
    event.dataTransfer.setData('text/plain', pages[index].title)
    if (row) {
      const rect = row.getBoundingClientRect()
      event.dataTransfer.setDragImage(row, event.clientX - rect.left, event.clientY - rect.top)
    }
    setDragIndex(index)
  }

  function handleRowDragOver(event, index) {
    if (dragIndex === null) return
    const rect = event.currentTarget.getBoundingClientRect()
    const inTopHalf = event.clientY < rect.top + rect.height / 2
    setDropIndex(inTopHalf ? index : index + 1)
  }

  function handleDrop(event) {
    if (dragIndex === null) return
    event.preventDefault()
    if (dropIndex !== null) reorder(dragIndex, dropIndex)
    endDrag()
  }

  // Keyboard alternative to dragging: arrow keys on the handle move the page one place.
  function handleHandleKeyDown(event, index) {
    if (event.key === 'ArrowUp' && index > 0) {
      event.preventDefault()
      reorder(index, index - 1)
    } else if (event.key === 'ArrowDown' && index < pages.length - 1) {
      event.preventDefault()
      reorder(index, index + 2)
    }
  }

  function dropLineFor(index) {
    if (dragIndex === null || dropIndex === null) return undefined
    // No line where dropping would leave the page where it already is.
    if (dropIndex === dragIndex || dropIndex === dragIndex + 1) return undefined
    if (dropIndex === index) return 'above'
    if (dropIndex === pages.length && index === pages.length - 1) return 'below'
    return undefined
  }

  const nextNavOrder = pages?.length ? Math.max(...pages.map((p) => p.nav_order)) + 1 : 0

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
        <>
          <Box overflowX="auto">
            <Box minW="2xl">
              <Box
                display="grid"
                gridTemplateColumns={COLUMNS}
                columnGap="4"
                px="4"
                fontSize="sm"
                fontWeight="medium"
                color="fg.muted"
              >
                <span />
                <span>Title</span>
                <span>URL</span>
                <span>Status</span>
                <span>Navigation</span>
                <span />
              </Box>

              {/* Drag events are handled here as well as on the rows, so the gaps between rows are valid drop targets. */}
              <Box
                as="ul"
                listStyleType="none"
                display="flex"
                flexDirection="column"
                gap={ROW_GAP}
                // Room for the drop line above the first row and below the last. This has to be padding:
                // anything drawn outside the list would overflow the horizontal scroll wrapper and add a
                // vertical scrollbar.
                py={ROW_GAP}
                onDragOver={(event) => {
                  if (dragIndex === null) return
                  event.preventDefault()
                  event.dataTransfer.dropEffect = 'move'
                }}
                onDrop={handleDrop}
                onDragLeave={(event) => {
                  // Hide the line when the pointer leaves the list entirely.
                  if (!event.currentTarget.contains(event.relatedTarget)) setDropIndex(null)
                }}
              >
                {pages.map((page, index) => {
                  const dropLine = dropLineFor(index)
                  return (
                    <Box
                      as="li"
                      key={page.id}
                      ref={(element) => {
                        if (element) rowRefs.current.set(page.id, element)
                        else rowRefs.current.delete(page.id)
                      }}
                      position="relative"
                      display="grid"
                      gridTemplateColumns={COLUMNS}
                      columnGap="4"
                      alignItems="center"
                      px="4"
                      py="3"
                      bg="bg"
                      borderWidth="1px"
                      borderRadius="lg"
                      opacity={dragIndex === index ? 0.4 : 1}
                      onDragOver={(event) => handleRowDragOver(event, index)}
                    >
                      {dropLine && (
                        <Box
                          position="absolute"
                          left="0"
                          right="0"
                          top={dropLine === 'above' ? DROP_LINE_OFFSET : undefined}
                          bottom={dropLine === 'below' ? DROP_LINE_OFFSET : undefined}
                          h={DROP_LINE_HEIGHT}
                          borderRadius="full"
                          bg="blue.solid"
                          pointerEvents="none"
                        />
                      )}
                      <Box
                        as="button"
                        type="button"
                        draggable
                        aria-label={`Reorder ${page.title}. Drag, or use the up and down arrow keys.`}
                        title="Drag to reorder"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        w="6"
                        h="8"
                        borderRadius="sm"
                        color="fg.muted"
                        cursor="grab"
                        _hover={{ bg: 'bg.muted', color: 'fg' }}
                        _active={{ cursor: 'grabbing' }}
                        onDragStart={(event) => handleDragStart(event, index)}
                        onDragEnd={endDrag}
                        onKeyDown={(event) => handleHandleKeyDown(event, index)}
                      >
                        <GripIcon />
                      </Box>
                      <Text fontWeight="medium" truncate>
                        {page.title}
                      </Text>
                      <Text color="fg.muted" truncate>
                        {pagePath(page.slug)}
                      </Text>
                      <Box>
                        {page.published ? <Badge colorPalette="green">Published</Badge> : <Badge>Draft</Badge>}
                      </Box>
                      <Text color="fg.muted">{page.show_in_nav ? 'Shown' : 'Hidden'}</Text>
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
                    </Box>
                  )
                })}
              </Box>
            </Box>
          </Box>
          {pages.length > 1 && (
            <Text mt="1" fontSize="sm" color="fg.muted">
              Drag the handle on the left to reorder. This is the order pages appear in the site navigation.
            </Text>
          )}
        </>
      )}

      <PageFormDialog
        open={dialog.open}
        page={dialog.page}
        nextNavOrder={nextNavOrder}
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

function GripIcon() {
  return (
    <svg width="10" height="16" viewBox="0 0 10 16" fill="currentColor" aria-hidden="true">
      <circle cx="2" cy="2" r="1.5" />
      <circle cx="8" cy="2" r="1.5" />
      <circle cx="2" cy="8" r="1.5" />
      <circle cx="8" cy="8" r="1.5" />
      <circle cx="2" cy="14" r="1.5" />
      <circle cx="8" cy="14" r="1.5" />
    </svg>
  )
}
