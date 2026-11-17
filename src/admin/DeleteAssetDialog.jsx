import { useState } from 'react'
import { Alert, Box, Button, CloseButton, Dialog, List, Stack, Text } from '@chakra-ui/react'
import { deleteAsset } from '../lib/assets.js'
import AdminPortal from './AdminPortal.jsx'
import FaIcon from './FaIcon.jsx'

// Confirms deleting an asset (see lib/assets.js) for good: its original, every crop, and
// its place on any page that shows it. When it is in use, the pages are listed.
export default function DeleteAssetDialog({ open, asset, onClose, onDeleted }) {
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  async function confirm() {
    setError('')
    setDeleting(true)
    try {
      await deleteAsset(asset.id)
      setDeleting(false)
      onDeleted()
    } catch (problem) {
      setError(`Could not delete the image: ${problem.message}`)
      setDeleting(false)
    }
  }

  const name = asset?.file_name || 'this image'
  const crops = asset?.crops.length ?? 0
  const usedOn = asset?.usedOn ?? []

  return (
    <Dialog.Root
      role="alertdialog"
      open={open}
      onOpenChange={(e) => {
        if (!e.open && !deleting) onClose()
      }}
      onExitComplete={() => setError('')}
      lazyMount
      unmountOnExit
    >
      <AdminPortal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>Delete image</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <Stack gap="4">
                {error && (
                  <Alert.Root status="error">
                    <Alert.Indicator />
                    <Alert.Title>{error}</Alert.Title>
                  </Alert.Root>
                )}
                <Text>
                  This permanently deletes{' '}
                  <Text as="strong" fontWeight="semibold" wordBreak="break-word">
                    {name}
                  </Text>
                  {crops > 0 && ` and its ${crops === 1 ? 'crop' : `${crops} crops`}`}. This cannot be undone.
                </Text>
                {usedOn.length > 0 && (
                  <Alert.Root status="warning" alignItems="flex-start">
                    <Alert.Indicator />
                    <Alert.Content>
                      <Alert.Title>
                        It will also be removed from {usedOn.length === 1 ? 'this page' : `these ${usedOn.length} pages`}:
                      </Alert.Title>
                      <Alert.Description>
                        <List.Root mt="1" ps="5">
                          {usedOn.map((page) => (
                            <List.Item key={page.id}>
                              {page.title}
                              {!page.published && ' (draft)'}
                            </List.Item>
                          ))}
                        </List.Root>
                        <Box mt="2">
                          The rest of each section is kept, with an empty space where the image was until a new
                          one is uploaded. Visitors won’t see an image there.
                        </Box>
                      </Alert.Description>
                    </Alert.Content>
                  </Alert.Root>
                )}
              </Stack>
            </Dialog.Body>
            <Dialog.Footer>
              <Button variant="outline" onClick={onClose} disabled={deleting}>
                Cancel
              </Button>
              <Button colorPalette="red" loading={deleting} onClick={confirm}>
                Delete image
                {/* f2ed = trash can */}
                <FaIcon code="f2ed" />
              </Button>
            </Dialog.Footer>
            <Dialog.CloseTrigger asChild>
              <CloseButton size="sm" disabled={deleting} />
            </Dialog.CloseTrigger>
          </Dialog.Content>
        </Dialog.Positioner>
      </AdminPortal>
    </Dialog.Root>
  )
}
