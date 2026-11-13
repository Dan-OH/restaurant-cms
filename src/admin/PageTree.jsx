import { useEffect, useState } from 'react'
import { Badge, Box, Button, HStack, Portal, Text, Tooltip } from '@chakra-ui/react'
import { ROOT } from '../lib/pageTree.js'
import ExternalLinkButton from './ExternalLinkButton.jsx'
import FaIcon from './FaIcon.jsx'

// Shared by the column headings and every row so the columns line up:
// handle | title | URL | status | navigation | actions
// The right-hand columns have fixed widths, so they stay aligned however deeply a row is nested.
export const COLUMNS = '1.5rem minmax(8rem, 1.5fr) minmax(6rem, 1fr) 6rem 6rem 14rem'

// Space between rows, and the drop line that sits centred in it.
const ROW_GAP = '0.5rem'
const DROP_LINE_HEIGHT = '2px'
const DROP_LINE_OFFSET = `calc((${ROW_GAP} + ${DROP_LINE_HEIGHT}) / -2)`

// One level of the tree: the children of `parentId`. Groups render another PageTree inside
// themselves. All state and behaviour lives in PagesList and arrives through `ctx`.
export default function PageTree({ parentId, ctx }) {
  const items = ctx.tree.get(parentId) ?? []
  const isRoot = parentId === ROOT
  // Where the dragged item would land in this list, if it is this list it is over.
  const lineIndex = ctx.dropLineIndex(parentId)

  return (
    <Box
      as="ul"
      listStyleType="none"
      display="flex"
      flexDirection="column"
      gap={ROW_GAP}
      // The padding gives the drop line room above the first row and below the last, and
      // is itself a drop zone: releasing there drops at the start or end of this list.
      pt={ROW_GAP}
      pb={isRoot ? '6' : ROW_GAP}
      // Nested lists are indented, with a rule down the left showing what belongs to the group.
      ml={isRoot ? undefined : '5'}
      pl={isRoot ? undefined : '4'}
      borderLeftWidth={isRoot ? undefined : '2px'}
      onDragOver={(event) => ctx.onListDragOver(event, parentId)}
    >
      {items.length === 0 && !isRoot && (
        <Box
          px="4"
          py="3"
          borderWidth="1px"
          borderStyle="dashed"
          borderColor={lineIndex === 0 ? 'blue.solid' : 'border'}
          borderRadius="lg"
          fontSize="sm"
          color="fg.muted"
        >
          This group is empty. Drag pages here, or pick this group when editing a page.
        </Box>
      )}

      {items.map((item, index) => {
        let dropLine
        if (lineIndex === index) dropLine = 'above'
        else if (lineIndex === items.length && index === items.length - 1) dropLine = 'below'

        return (
          <Box
            as="li"
            key={item.id}
            ref={(element) => ctx.registerItem(item.id, element)}
            position="relative"
            opacity={ctx.dragId === item.id ? 0.4 : 1}
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
              ref={(element) => ctx.registerRow(item.id, element)}
              display="grid"
              gridTemplateColumns={COLUMNS}
              columnGap="4"
              alignItems="center"
              px="4"
              py="3"
              bg="bg"
              borderWidth="1px"
              borderRadius="lg"
            >
              <Box
                as="button"
                type="button"
                draggable
                aria-label={`Reorder ${item.title}. Drag, or use the up and down arrow keys.`}
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
                onDragStart={(event) => ctx.onDragStart(event, item)}
                onDragEnd={ctx.onDragEnd}
                onKeyDown={(event) => ctx.onHandleKeyDown(event, item)}
              >
                <FaIcon code="f58e" />
              </Box>

              {item.kind === 'group' ? <GroupCells group={item} ctx={ctx} /> : <PageCells page={item} ctx={ctx} />}
            </Box>

            {item.kind === 'group' && <PageTree parentId={item.id} ctx={ctx} />}
          </Box>
        )
      })}
    </Box>
  )
}

function PageCells({ page, ctx }) {
  return (
    <>
      <Text fontWeight="medium" truncate>
        {page.title}
      </Text>
      <UrlText url={ctx.paths.get(page.id)} copyable />
      <Box>{page.published ? <Badge colorPalette="green">Published</Badge> : <Badge>Draft</Badge>}</Box>
      <Text color="fg.muted">{page.show_in_nav ? 'Shown' : 'Hidden'}</Text>
      <HStack justify="flex-end" gap="2">
        {page.published && (
          <ExternalLinkButton href={ctx.paths.get(page.id)} size="sm" variant="ghost">
            View
          </ExternalLinkButton>
        )}
        <Button size="sm" variant="outline" onClick={() => ctx.onEditPage(page)}>
          Edit
        </Button>
        <Button size="sm" variant="outline" colorPalette="red" onClick={() => ctx.onDelete(page)}>
          Delete
        </Button>
      </HStack>
    </>
  )
}

function GroupCells({ group, ctx }) {
  const count = (ctx.tree.get(group.id) ?? []).length

  return (
    <>
      <HStack gap="2" minW="0">
        {/* f07b = folder */}
        <FaIcon code="f07b" color="fg.muted" />
        <Text fontWeight="medium" truncate>
          {group.title}
        </Text>
      </HStack>
      {/* The start of the address of everything inside the group. */}
      <UrlText url={`${ctx.paths.get(group.id)}/`} />
      {/* Spans the status and navigation columns, which don't apply to a group. */}
      <Text color="fg.muted" gridColumn="span 2" truncate>
        Group · {count === 1 ? '1 item' : `${count} items`}
      </Text>
      <HStack justify="flex-end" gap="2">
        <Button size="sm" variant="outline" onClick={() => ctx.onEditGroup(group)}>
          Edit
        </Button>
        <Button size="sm" variant="outline" colorPalette="red" onClick={() => ctx.onDelete(group)}>
          Delete
        </Button>
      </HStack>
    </>
  )
}

// A URL that is cut off with "…" when the column is too narrow; hovering shows it in full.
// With `copyable`, clicking copies the complete link (including the site's domain) to the
// clipboard, and the tooltip says so. Group prefixes aren't copyable: they aren't pages.
function UrlText({ url, copyable = false }) {
  // null | 'copied' | 'failed'; shown in the tooltip briefly after a click.
  const [result, setResult] = useState(null)

  useEffect(() => {
    if (!result) return
    const timer = setTimeout(() => setResult(null), 2000)
    return () => clearTimeout(timer)
  }, [result])

  async function copy() {
    try {
      await navigator.clipboard.writeText(new URL(url, window.location.origin).href)
      setResult('copied')
    } catch {
      // Browsers only allow clipboard access on https (or localhost).
      setResult('failed')
    }
  }

  let hint = 'Click to copy link'
  if (result === 'copied') hint = 'Link copied'
  if (result === 'failed') hint = 'Could not copy'

  const text = copyable ? (
    <Text
      as="button"
      type="button"
      display="block"
      maxW="full"
      textAlign="left"
      color="fg.muted"
      cursor="pointer"
      truncate
      _hover={{ color: 'fg', textDecoration: 'underline' }}
      aria-label={`Copy link to ${url}`}
      onClick={copy}
    >
      {url}
    </Text>
  ) : (
    <Text color="fg.muted" truncate>
      {url}
    </Text>
  )

  return (
    <Tooltip.Root
      openDelay={300}
      closeDelay={0}
      // Stay open on click so the "Link copied" confirmation can be seen.
      closeOnClick={false}
      closeOnPointerDown={false}
      positioning={{ placement: 'top-start' }}
    >
      <Tooltip.Trigger asChild>{text}</Tooltip.Trigger>
      <Portal>
        <Tooltip.Positioner>
          <Tooltip.Content maxW="lg">
            <Text wordBreak="break-all">{url}</Text>
            {copyable && (
              <Text mt="1" opacity="0.7" aria-live="polite">
                {hint}
              </Text>
            )}
          </Tooltip.Content>
        </Tooltip.Positioner>
      </Portal>
    </Tooltip.Root>
  )
}
