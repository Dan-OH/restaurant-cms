import { useRef, useState } from 'react'
import { Box, Button, ChakraProvider, Flex, IconButton, Text } from '@chakra-ui/react'
import { getSectionType } from '../sections/index.js'
import { EMBED_CLASS, embeddedSystem } from './embeddedSystem.js'
import FaIcon from './FaIcon.jsx'
import { PortalContainerContext } from './portalContainer.js'
import RemoveSectionDialog from './RemoveSectionDialog.jsx'
import SectionLibraryDialog from './SectionLibraryDialog.jsx'
import SectionSettingsDialog from './SectionSettingsDialog.jsx'

// Draws a page's sections for editing, in place of the normal page content. Each section
// is drawn by its own design, exactly as visitors see it, and is typed into directly. On
// top of that this adds the things that only exist while editing: an outline and a small
// toolbar per section (drag to reorder, settings where the design has any, remove), and
// the "Add section" button.
//
// Loaded on demand by src/site/SitePage.jsx when an editor turns editing on, so visitors
// never download it or Chakra. It holds no data of its own:
//
//   sections   [{ id, type, content }] in display order.
//   onChange   Called with an updater, onChange((current) => next), for every edit.
//
// Only the editing controls sit inside EMBED_CLASS (Chakra's confined styles, see
// embeddedSystem.js). The sections themselves stay outside it, so they look as they do
// on the live site.
export default function ContentEditor({ sections, onChange }) {
  const [libraryOpen, setLibraryOpen] = useState(false)
  // Whose settings dialog is open. The id is kept while the dialog closes.
  const [settings, setSettings] = useState({ open: false, sectionId: null })
  // The section waiting for the user to confirm its removal. `label` is kept while the
  // dialog closes so its text doesn't change during the exit animation.
  const [removal, setRemoval] = useState({ open: false, sectionId: null, label: '' })
  // The element dialogs are rendered into. See portalContainer.js.
  const [portalContainer, setPortalContainer] = useState(null)
  // Drag state: the index being dragged and the gap it would be dropped into.
  const [dragIndex, setDragIndex] = useState(null)
  const [dropIndex, setDropIndex] = useState(null)
  const frameElements = useRef(new Map())

  function addSection(definition) {
    const section = { id: crypto.randomUUID(), type: definition.type, content: { ...definition.defaultContent } }
    onChange((current) => [...current, section])
    setLibraryOpen(false)
  }

  function removeSection(sectionId) {
    onChange((current) => current.filter((section) => section.id !== sectionId))
  }

  function setField(sectionId, name, value) {
    onChange((current) =>
      current.map((section) =>
        section.id === sectionId ? { ...section, content: { ...section.content, [name]: value } } : section,
      ),
    )
  }

  // Moves the section at `from` into the gap `to` (0 = before the first section).
  function moveSection(from, to) {
    if (to === from || to === from + 1) return
    onChange((current) => {
      const next = [...current]
      const [section] = next.splice(from, 1)
      next.splice(to > from ? to - 1 : to, 0, section)
      return next
    })
  }

  function endDrag() {
    setDragIndex(null)
    setDropIndex(null)
  }

  function handleDragStart(event, index) {
    const frame = frameElements.current.get(sections[index].id)
    event.dataTransfer.effectAllowed = 'move'
    // Firefox only starts a drag when some data is set.
    event.dataTransfer.setData('text/plain', 'section')
    if (frame) {
      const rect = frame.getBoundingClientRect()
      event.dataTransfer.setDragImage(frame, event.clientX - rect.left, event.clientY - rect.top)
    }
    setDragIndex(index)
  }

  // Handled on the whole list, so anywhere over the page content is a valid drop target.
  function handleDragOver(event) {
    if (dragIndex === null) return
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
    // The gap is before the first section whose middle is below the pointer.
    let index = sections.length
    for (const [position, section] of sections.entries()) {
      const rect = frameElements.current.get(section.id)?.getBoundingClientRect()
      if (rect && event.clientY < rect.top + rect.height / 2) {
        index = position
        break
      }
    }
    setDropIndex(index)
  }

  function handleDrop(event) {
    if (dragIndex === null) return
    event.preventDefault()
    if (dropIndex !== null) moveSection(dragIndex, dropIndex)
    endDrag()
  }

  // Keyboard alternative to dragging: arrow keys on the handle move the section one place.
  function handleHandleKeyDown(event, index) {
    if (event.key === 'ArrowUp' && index > 0) {
      event.preventDefault()
      moveSection(index, index - 1)
    } else if (event.key === 'ArrowDown' && index < sections.length - 1) {
      event.preventDefault()
      moveSection(index, index + 2)
    }
  }

  // No line where dropping would leave the section where it already is.
  const lineIndex =
    dragIndex !== null && dropIndex !== null && dropIndex !== dragIndex && dropIndex !== dragIndex + 1
      ? dropIndex
      : null

  return (
    <ChakraProvider value={embeddedSystem}>
      <PortalContainerContext.Provider value={portalContainer}>
        <Box
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onDragLeave={(event) => {
            // Hide the line when the pointer leaves the content entirely.
            if (!event.currentTarget.contains(event.relatedTarget)) setDropIndex(null)
          }}
        >
          {sections.map((section, index) => {
            const definition = getSectionType(section.type)
            const Section = definition?.Render
            const label = definition?.label ?? 'Unknown section'

            let dropLine
            if (lineIndex === index) dropLine = 'above'
            else if (lineIndex === sections.length && index === sections.length - 1) dropLine = 'below'

            return (
              <Box
                key={section.id}
                ref={(element) => {
                  if (element) frameElements.current.set(section.id, element)
                  else frameElements.current.delete(section.id)
                }}
                position="relative"
                // An outline rather than a border, so the frame takes up no space and the
                // section sits exactly where it does on the live page.
                outline="1px dashed"
                outlineColor="gray.300"
                outlineOffset="-1px"
                _hover={{ outlineColor: 'gray.500' }}
                _focusWithin={{ outlineStyle: 'solid', outlineColor: 'blue.500' }}
                opacity={dragIndex === index ? 0.4 : 1}
              >
                {dropLine && (
                  <Box
                    position="absolute"
                    left="0"
                    right="0"
                    top={dropLine === 'above' ? '-1px' : undefined}
                    bottom={dropLine === 'below' ? '-1px' : undefined}
                    h="2px"
                    zIndex="2"
                    bg="blue.solid"
                    pointerEvents="none"
                  />
                )}

                {/* The section's toolbar, tucked into its top-right corner. */}
                <Flex
                  className={EMBED_CLASS}
                  position="absolute"
                  top="1"
                  right="1"
                  zIndex="1"
                  align="center"
                  gap="1"
                  pl="1"
                  bg="bg"
                  borderWidth="1px"
                  borderColor="border"
                  borderRadius="md"
                  shadow="xs"
                >
                  <Box
                    as="button"
                    type="button"
                    draggable
                    aria-label={`Reorder ${label} section. Drag, or use the up and down arrow keys.`}
                    title="Drag to reorder"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    w="5"
                    h="6"
                    borderRadius="sm"
                    fontSize="xs"
                    color="fg.muted"
                    cursor="grab"
                    _hover={{ bg: 'bg.muted', color: 'fg' }}
                    _active={{ cursor: 'grabbing' }}
                    onDragStart={(event) => handleDragStart(event, index)}
                    onDragEnd={endDrag}
                    onKeyDown={(event) => handleHandleKeyDown(event, index)}
                  >
                    {/* f58e = grip */}
                    <FaIcon code="f58e" />
                  </Box>
                  <Text fontSize="xs" fontWeight="medium" color="fg.muted">
                    {label}
                  </Text>
                  {definition?.Settings && (
                    <IconButton
                      size="2xs"
                      variant="ghost"
                      aria-label={`${label} section settings`}
                      title="Section settings"
                      onClick={() => setSettings({ open: true, sectionId: section.id })}
                    >
                      {/* f013 = gear */}
                      <FaIcon code="f013" />
                    </IconButton>
                  )}
                  <IconButton
                    size="2xs"
                    variant="ghost"
                    colorPalette="red"
                    aria-label={`Remove ${label} section`}
                    title="Remove section"
                    onClick={() => setRemoval({ open: true, sectionId: section.id, label })}
                  >
                    {/* f2ed = trash can */}
                    <FaIcon code="f2ed" />
                  </IconButton>
                </Flex>

                {Section ? (
                  <Section content={section.content} onChange={(name, value) => setField(section.id, name, value)} />
                ) : (
                  <Box className={EMBED_CLASS} p="6" pt="10">
                    <Text fontSize="sm" color="fg.muted">
                      This section’s design (“{section.type}”) is no longer in the site’s files, so it can’t be
                      edited and isn’t shown to visitors. Its content is kept unless you remove the section.
                    </Text>
                  </Box>
                )}
              </Box>
            )
          })}
        </Box>

        <Flex className={EMBED_CLASS} direction="column" align="center" gap="3" py="6">
          {sections.length === 0 && (
            <Text fontSize="sm" color="fg.muted">
              This page has no content yet.
            </Text>
          )}
          <Button variant="outline" size="sm" onClick={() => setLibraryOpen(true)}>
            Add section
            {/* 2b = plus */}
            <FaIcon code="2b" />
          </Button>
        </Flex>

        {/* Dialogs render in here. See portalContainer.js. */}
        <div className={EMBED_CLASS} ref={setPortalContainer} />

        <RemoveSectionDialog
          open={removal.open}
          label={removal.label}
          onClose={() => setRemoval((current) => ({ ...current, open: false }))}
          onConfirm={() => {
            removeSection(removal.sectionId)
            setRemoval((current) => ({ ...current, open: false }))
          }}
        />

        <SectionSettingsDialog
          open={settings.open}
          section={sections.find((section) => section.id === settings.sectionId) ?? null}
          onChange={(name, value) => setField(settings.sectionId, name, value)}
          onClose={() => setSettings((current) => ({ ...current, open: false }))}
        />

        <SectionLibraryDialog open={libraryOpen} onClose={() => setLibraryOpen(false)} onPick={addSection} />
      </PortalContainerContext.Provider>
    </ChakraProvider>
  )
}
