import { useState } from 'react'
import { Alert, Button, CloseButton, Dialog } from '@chakra-ui/react'
import AdminPortal from './AdminPortal.jsx'
import FaIcon from './FaIcon.jsx'
import ImageCropper from './ImageCropper.jsx'

// Dialog that asks the user to crop an image to a shape.
//
//   source     The image file to crop, or null. The dialog is open while this is set.
//   preset     The shape to crop to (see ImageCropper).
//   busy       True while the result is being processed; disables the buttons.
//   error      Message to show if that failed.
//   onCancel   Close without cropping.
//   onConfirm  Called with the chosen part of the image (see ImageCropper's onAreaChange).
export default function ImageCropDialog({ source, preset, busy, error, onCancel, onConfirm }) {
  const [area, setArea] = useState(null)

  return (
    <Dialog.Root
      size="lg"
      open={Boolean(source)}
      onOpenChange={(e) => {
        if (!e.open && !busy) onCancel()
      }}
      onExitComplete={() => setArea(null)}
      lazyMount
      unmountOnExit
    >
      <AdminPortal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>Crop image</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              {error && (
                <Alert.Root status="error" mb="4">
                  <Alert.Indicator />
                  <Alert.Title>{error}</Alert.Title>
                </Alert.Root>
              )}
              {source && <ImageCropper source={source} preset={preset} onAreaChange={setArea} />}
            </Dialog.Body>
            <Dialog.Footer>
              <Button variant="outline" onClick={onCancel} disabled={busy}>
                Cancel
              </Button>
              <Button disabled={!area} loading={busy} onClick={() => onConfirm(area)}>
                Crop and use image
                {/* f565 = crop */}
                <FaIcon code="f565" />
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
