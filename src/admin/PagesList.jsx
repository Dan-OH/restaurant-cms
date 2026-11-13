import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Alert, Box, Button, Center, Flex, Heading, HStack, Spinner, Text } from '@chakra-ui/react'
import { supabase } from '../lib/supabase.js'
import { ROOT, childrenByParent, descendantIds, pagePaths, parentOf } from '../lib/pageTree.js'
import DeletePageDialog from './DeletePageDialog.jsx'
import GroupFormDialog from './GroupFormDialog.jsx'
import PageFormDialog from './PageFormDialog.jsx'
import PageTree, { COLUMNS } from './PageTree.jsx'

const CLOSED = { open: false, item: null }

export default function PagesList() {
  // Every page and group, as flat rows. `tree` arranges them by parent for display.
  const [pages, setPages] = useState(null)
  const [error, setError] = useState('')
  // item = null means the dialog is creating something new.
  const [pageDialog, setPageDialog] = useState(CLOSED)
  const [groupDialog, setGroupDialog] = useState(CLOSED)
  const [deleteDialog, setDeleteDialog] = useState(CLOSED)

  // Drag state: the id being dragged, and where it would land: { parentId, index }, where
  // index is the gap in that parent's list (0 = before its first child).
  const [dragId, setDragId] = useState(null)
  const [drop, setDrop] = useState(null)
  // DOM elements by id: the whole list item (a group's includes its contents) and just its row.
  const itemElements = useRef(new Map())
  const rowElements = useRef(new Map())

  const tree = useMemo(() => childrenByParent(pages ?? []), [pages])
  const paths = useMemo(() => pagePaths(pages ?? []), [pages])

  // A group can't be dropped inside itself or anything it contains.
  const forbiddenParents = useMemo(
    () => (dragId && pages ? new Set([dragId, ...descendantIds(pages, dragId)]) : new Set()),
    [dragId, pages],
  )

  const load = useCallback(
    () =>
      supabase
        .from('pages')
        .select('*')
        .then(({ data, error }) => {
          if (error) setError(error.message)
          else setPages(data)
        }),
    [],
  )

  useEffect(() => {
    load()
  }, [load])

  // True when dropping at `target` would leave the item exactly where it already is.
  function isSamePlace(id, target) {
    const item = pages.find((row) => row.id === id)
    if (!item || parentOf(item) !== target.parentId) return false
    const index = (tree.get(target.parentId) ?? []).findIndex((row) => row.id === id)
    return target.index === index || target.index === index + 1
  }

  // Moves an item into the gap `index` of `parentId`'s list and saves the result.
  async function moveItem(id, parentId, index) {
    const item = pages.find((row) => row.id === id)
    if (!item || forbiddenParents.has(parentId) || isSamePlace(id, { parentId, index })) return

    const current = tree.get(parentId) ?? []
    const currentIndex = current.findIndex((row) => row.id === id)
    const siblings = current.filter((row) => row.id !== id)
    // If the item is already earlier in this same list, removing it shifts the gap up by one.
    const insertAt = currentIndex !== -1 && currentIndex < index ? index - 1 : index
    siblings.splice(insertAt, 0, item)

    // Renumber the destination list, and collect only the rows that actually change.
    const patches = new Map()
    siblings.forEach((row, position) => {
      const patch = {}
      if (row.nav_order !== position) patch.nav_order = position
      if (row.id === id && parentOf(row) !== parentId) patch.parent_id = parentId
      if (Object.keys(patch).length) patches.set(row.id, patch)
    })

    setError('')
    setPages(pages.map((row) => (patches.has(row.id) ? { ...row, ...patches.get(row.id) } : row)))

    const results = await Promise.all(
      [...patches].map(([rowId, patch]) => supabase.from('pages').update(patch).eq('id', rowId)),
    )
    const failed = results.find((result) => result.error)
    if (failed) {
      // 23505 = two items in the same place would share a URL slug.
      setError(
        failed.error.code === '23505'
          ? `"${item.title}" can't be moved there: another page or group in that place already uses the URL slug "${item.slug}". Change one of the slugs first.`
          : `Could not save the change: ${failed.error.message}`,
      )
      load()
    }
  }

  function endDrag() {
    setDragId(null)
    setDrop(null)
  }

  function handleDragStart(event, item) {
    const element = itemElements.current.get(item.id)
    event.dataTransfer.effectAllowed = 'move'
    // Firefox only starts a drag when some data is set.
    event.dataTransfer.setData('text/plain', item.title)
    if (element) {
      const rect = element.getBoundingClientRect()
      event.dataTransfer.setDragImage(element, event.clientX - rect.left, event.clientY - rect.top)
    }
    setDragId(item.id)
  }

  // Works out where the pointer is within one list (the children of `parentId`). Each list
  // handles its own events and stops them there, so the innermost list under the pointer wins.
  function handleListDragOver(event, parentId) {
    if (!dragId) return
    event.preventDefault()
    event.stopPropagation()
    event.dataTransfer.dropEffect = 'move'

    const target = findDropTarget(event.clientY, parentId)
    setDrop(forbiddenParents.has(target.parentId) ? null : target)
  }

  function findDropTarget(pointerY, parentId) {
    const items = tree.get(parentId) ?? []
    for (const [index, item] of items.entries()) {
      const row = rowElements.current.get(item.id)?.getBoundingClientRect()
      if (!row) continue
      // Upper half of a row: drop just before it.
      if (pointerY < row.top + row.height / 2) return { parentId, index }
      if (item.kind === 'group') {
        // Lower half of a group's row: drop inside the group, at the top. (The group's
        // contents are a list of their own, so the pointer can't be over them here.)
        const whole = itemElements.current.get(item.id)?.getBoundingClientRect()
        if (whole && pointerY <= whole.bottom) return { parentId: item.id, index: 0 }
      }
      // Otherwise the pointer is below this item's midpoint; the next item decides.
    }
    return { parentId, index: items.length }
  }

  function handleDrop(event) {
    if (!dragId) return
    event.preventDefault()
    if (drop) moveItem(dragId, drop.parentId, drop.index)
    endDrag()
  }

  // Keyboard alternative to dragging: arrow keys on the handle move the item one place
  // within its current list. (Moving between groups by keyboard is done in the edit dialog.)
  function handleHandleKeyDown(event, item) {
    const parentId = parentOf(item)
    const siblings = tree.get(parentId) ?? []
    const index = siblings.findIndex((row) => row.id === item.id)
    if (event.key === 'ArrowUp' && index > 0) {
      event.preventDefault()
      moveItem(item.id, parentId, index - 1)
    } else if (event.key === 'ArrowDown' && index < siblings.length - 1) {
      event.preventDefault()
      moveItem(item.id, parentId, index + 2)
    }
  }

  const treeContext = {
    tree,
    paths,
    dragId,
    // The gap to draw the drop line in for one list, or null. No line is drawn where
    // dropping would leave the item where it already is.
    dropLineIndex: (parentId) =>
      dragId && drop && drop.parentId === parentId && !isSamePlace(dragId, drop) ? drop.index : null,
    registerItem: (id, element) => register(itemElements.current, id, element),
    registerRow: (id, element) => register(rowElements.current, id, element),
    onListDragOver: handleListDragOver,
    onDragStart: handleDragStart,
    onDragEnd: endDrag,
    onHandleKeyDown: handleHandleKeyDown,
    onEditPage: (page) => setPageDialog({ open: true, item: page }),
    onEditGroup: (group) => setGroupDialog({ open: true, item: group }),
    onDelete: (item) => setDeleteDialog({ open: true, item }),
  }

  // Keep `item` while a dialog closes so its contents don't change during the exit animation.
  const close = (setDialog) => () => setDialog((current) => ({ ...current, open: false }))
  const closeAndReload = (setDialog) => () => {
    close(setDialog)()
    load()
  }

  return (
    <Box>
      <Flex justify="space-between" align="center" gap="4" mb="6">
        <Heading size="2xl">Pages</Heading>
        <HStack gap="2">
          <Button variant="outline" onClick={() => setGroupDialog({ open: true, item: null })}>
            New group
          </Button>
          <Button onClick={() => setPageDialog({ open: true, item: null })}>New page</Button>
        </HStack>
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

              <Box
                onDrop={handleDrop}
                onDragLeave={(event) => {
                  // Hide the line when the pointer leaves the list entirely.
                  if (!event.currentTarget.contains(event.relatedTarget)) setDrop(null)
                }}
              >
                <PageTree parentId={ROOT} ctx={treeContext} />
              </Box>
            </Box>
          </Box>
          <Text fontSize="sm" color="fg.muted">
            Drag the handle on the left to reorder, or to move a page into or out of a group. This is the order
            pages appear in the site navigation.
          </Text>
        </>
      )}

      <PageFormDialog
        open={pageDialog.open}
        page={pageDialog.item}
        pages={pages ?? []}
        onClose={close(setPageDialog)}
        onSaved={closeAndReload(setPageDialog)}
      />

      <GroupFormDialog
        open={groupDialog.open}
        group={groupDialog.item}
        pages={pages ?? []}
        onClose={close(setGroupDialog)}
        onSaved={closeAndReload(setGroupDialog)}
      />

      <DeletePageDialog
        open={deleteDialog.open}
        item={deleteDialog.item}
        pages={pages ?? []}
        onClose={close(setDeleteDialog)}
        onDeleted={closeAndReload(setDeleteDialog)}
      />
    </Box>
  )
}

function register(elements, id, element) {
  if (element) elements.set(id, element)
  else elements.delete(id)
}
