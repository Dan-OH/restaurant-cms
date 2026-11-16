import { useRef, useState } from 'react'
import { Box, Button, HStack, Text } from '@chakra-ui/react'
import { MAX_UPLOAD_BYTES, cropImage, downloadOriginal, uploadCropped, uploadOriginal } from '../lib/images.js'
import { getImagePreset } from '../sections/imagePresets.js'
import { EMBED_CLASS } from './embeddedSystem.js'
import FaIcon from './FaIcon.jsx'
import ImageCropDialog from './ImageCropDialog.jsx'

// An image while its section is being edited: the image as visitors see it (`image`, drawn
// by src/sections/EditableImage.jsx), plus buttons to upload, replace and re-crop. Choosing
// a file always goes through the crop dialog. Admin UI, loaded on demand by EditableImage.jsx,
// which also documents `content` and `onChange`.
export default function ImageEditor({ content, onChange, image }) {
  const preset = getImagePreset(content.preset)
  const fileInput = useRef(null)
  // What is open in the crop dialog: { blob, file }. `file` is set for a newly chosen
  // file, which still has to be uploaded; it is absent when re-cropping the stored original.
  const [cropping, setCropping] = useState(null)
  const [busy, setBusy] = useState(false)
  // Shown under the buttons (problems choosing or fetching a file) or in the dialog.
  const [error, setError] = useState('')

  function handleFileChosen(event) {
    const file = event.target.files?.[0]
    // Allow choosing the same file again later.
    event.target.value = ''
    if (!file) return
    setError('')
    if (!file.type.startsWith('image/')) return setError('That file is not an image.')
    if (file.size > MAX_UPLOAD_BYTES) return setError('That image is too large. The limit is 20 MB.')
    setCropping({ blob: file, file })
  }

  async function cropAgain() {
    setError('')
    setBusy(true)
    try {
      setCropping({ blob: await downloadOriginal(content.original) })
    } catch (problem) {
      setError(`Could not load the original image: ${problem.message}`)
    }
    setBusy(false)
  }

  async function handleCropConfirmed(area) {
    setError('')
    setBusy(true)
    try {
      // The original is kept as uploaded, so it can be cropped again for another shape.
      const original = cropping.file ? await uploadOriginal(cropping.file) : content.original
      const cropped = await uploadCropped(original, await cropImage(cropping.blob, area, preset))
      onChange('original', original)
      onChange('cropped', cropped)
      setCropping(null)
    } catch (problem) {
      setError(`Could not save the image: ${problem.message}`)
    }
    setBusy(false)
  }

  const dialogOpen = cropping !== null

  return (
    <>
      <input ref={fileInput} type="file" accept="image/*" hidden onChange={handleFileChosen} />

      {image ? (
        <>
          {image}
          {/* Floats over the bottom-left corner of the image. */}
          <Box className={EMBED_CLASS} position="absolute" left="2" bottom="2">
            <HStack gap="2">
              <Button size="xs" variant="outline" bg="bg" shadow="xs" onClick={() => fileInput.current.click()}>
                Replace image
                {/* f093 = upload */}
                <FaIcon code="f093" />
              </Button>
              <Button size="xs" variant="outline" bg="bg" shadow="xs" loading={busy && !dialogOpen} onClick={cropAgain}>
                Crop again
                {/* f565 = crop */}
                <FaIcon code="f565" />
              </Button>
            </HStack>
            {error && !dialogOpen && (
              <Text mt="2" px="2" py="1" fontSize="xs" color="fg.error" bg="bg" borderRadius="sm">
                {error}
              </Text>
            )}
          </Box>
        </>
      ) : (
        <Box
          className={EMBED_CLASS}
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          gap="3"
          minH="14rem"
          p="6"
          bg="bg.subtle"
          borderWidth="1px"
          borderStyle="dashed"
          // Set explicitly: Chakra's confined reset styles what is inside an EMBED_CLASS
          // element, not the element itself.
          borderColor="border.emphasized"
          borderRadius="lg"
        >
          {/* f03e = image */}
          <FaIcon code="f03e" fontSize="2xl" color="fg.subtle" />
          <Button size="sm" onClick={() => fileInput.current.click()}>
            Upload image
            {/* f093 = upload */}
            <FaIcon code="f093" />
          </Button>
          <Text fontSize="sm" color="fg.muted">
            It will be cropped to the {preset.label} ({preset.ratio}) shape. Change the shape in this section’s
            settings.
          </Text>
          {error && !dialogOpen && (
            <Text fontSize="sm" color="fg.error">
              {error}
            </Text>
          )}
        </Box>
      )}

      <ImageCropDialog
        source={cropping?.blob ?? null}
        preset={preset}
        busy={busy}
        error={dialogOpen ? error : ''}
        onCancel={() => {
          setCropping(null)
          setError('')
        }}
        onConfirm={handleCropConfirmed}
      />
    </>
  )
}
