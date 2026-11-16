import { Suspense } from 'react'
import { Center, CloseButton, Dialog, Spinner } from '@chakra-ui/react'
import { getSectionType } from '../sections/index.js'
import AdminPortal from './AdminPortal.jsx'

// The dialog behind a section's settings button. The dialog itself is the same for every
// kind of section; what is inside comes from the section design's own `Settings` component
// (see src/sections/index.js), which draws the body and footer.
//
//   section   The section whose settings are open. Kept by the caller while the dialog
//             closes, so the contents don't vanish mid-animation.
//   onChange  onChange(name, value) stores value as section.content[name].
export default function SectionSettingsDialog({ open, section, onChange, onClose }) {
  const definition = section ? getSectionType(section.type) : null
  const Settings = definition?.Settings

  return (
    <Dialog.Root
      size="lg"
      open={open && Boolean(Settings)}
      onOpenChange={(e) => {
        if (!e.open) onClose()
      }}
      // Settings may hold half-finished choices; a stray click outside shouldn't lose them.
      closeOnInteractOutside={false}
      lazyMount
      unmountOnExit
    >
      <AdminPortal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>{definition?.label} settings</Dialog.Title>
            </Dialog.Header>
            {Settings && (
              <Suspense
                fallback={
                  <Center py="16">
                    <Spinner />
                  </Center>
                }
              >
                <Settings content={section.content} onChange={onChange} onClose={onClose} />
              </Suspense>
            )}
            <Dialog.CloseTrigger asChild>
              <CloseButton size="sm" />
            </Dialog.CloseTrigger>
          </Dialog.Content>
        </Dialog.Positioner>
      </AdminPortal>
    </Dialog.Root>
  )
}
