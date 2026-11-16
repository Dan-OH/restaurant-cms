import { useState } from 'react'
import { Alert, Box, Button, Dialog, Field, Input, SimpleGrid, Stack, Text } from '@chakra-ui/react'
import FaIcon from '../../admin/FaIcon.jsx'
import ImageCropper from '../../admin/ImageCropper.jsx'
import { cropImage, downloadOriginal, uploadCropped } from '../../lib/images.js'
import { IMAGE_PRESETS, getImagePreset } from '../imagePresets.js'

// Settings for a section that has an image, shown inside the settings dialog (see
// src/sections/index.js): the image's shape and its description.
//
// Other section designs with an image reuse this and add options of their own through
// `extra` (see image-text/ImageTextSettings.jsx):
//   extra.initial   Starting values, e.g. { imageSide: 'left' }.
//   extra.render    (values, setValue) => the extra fields. setValue(name, value) changes one.
// On "Apply", each extra value is stored as content[name], along with the image settings.
//
// The image on the site has to match the chosen shape, so when the shape changes and an
// image has already been uploaded, "Apply" moves to a second step that asks the user to
// crop the original again. The shape only changes once that crop is done.
export default function ImageSettings({ content, onChange, onClose, extra }) {
  const [presetId, setPresetId] = useState(getImagePreset(content.preset).id)
  const [alt, setAlt] = useState(content.alt ?? '')
  const [extraValues, setExtraValues] = useState(extra?.initial ?? {})
  // Set during the second step: the original image file, fetched from storage.
  const [original, setOriginal] = useState(null)
  const [area, setArea] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const preset = getImagePreset(presetId)
  const shapeChanged = presetId !== getImagePreset(content.preset).id
  const needsCrop = shapeChanged && Boolean(content.original)

  // Everything except the cropped image itself, which only the crop step produces.
  function applyValues() {
    onChange('alt', alt.trim())
    onChange('preset', presetId)
    for (const [name, value] of Object.entries(extraValues)) onChange(name, value)
  }

  async function apply() {
    if (!needsCrop) {
      applyValues()
      return onClose()
    }
    setError('')
    setBusy(true)
    try {
      setOriginal(await downloadOriginal(content.original))
    } catch (problem) {
      setError(`Could not load the original image: ${problem.message}`)
    }
    setBusy(false)
  }

  async function cropAndApply() {
    setError('')
    setBusy(true)
    try {
      const cropped = await uploadCropped(content.original, await cropImage(original, area, preset))
      applyValues()
      onChange('cropped', cropped)
      onClose()
    } catch (problem) {
      setError(`Could not save the image: ${problem.message}`)
      setBusy(false)
    }
  }

  const errorAlert = error && (
    <Alert.Root status="error">
      <Alert.Indicator />
      <Alert.Title>{error}</Alert.Title>
    </Alert.Root>
  )

  if (original) {
    return (
      <>
        <Dialog.Body>
          <Stack gap="4">
            {errorAlert}
            <Text>The shape has changed, so the image needs to be cropped again to fit it.</Text>
            <ImageCropper source={original} preset={preset} onAreaChange={setArea} />
          </Stack>
        </Dialog.Body>
        <Dialog.Footer>
          <Button
            variant="outline"
            disabled={busy}
            onClick={() => {
              setOriginal(null)
              setArea(null)
              setError('')
            }}
          >
            Back
          </Button>
          <Button disabled={!area} loading={busy} onClick={cropAndApply}>
            Crop and apply
            {/* f565 = crop */}
            <FaIcon code="f565" />
          </Button>
        </Dialog.Footer>
      </>
    )
  }

  return (
    <>
      <Dialog.Body>
        <Stack gap="5">
          {errorAlert}

          <Field.Root>
            <Field.Label>Shape</Field.Label>
            <SimpleGrid columns={{ base: 2, sm: 3 }} gap="2" w="full" role="radiogroup" aria-label="Shape">
              {IMAGE_PRESETS.map((option) => {
                const selected = option.id === presetId
                return (
                  <Box
                    as="button"
                    type="button"
                    key={option.id}
                    role="radio"
                    aria-checked={selected}
                    display="flex"
                    flexDirection="column"
                    alignItems="center"
                    gap="2"
                    p="3"
                    borderWidth="2px"
                    borderColor={selected ? 'blue.solid' : 'border'}
                    borderRadius="lg"
                    cursor="pointer"
                    _hover={{ bg: 'bg.muted' }}
                    onClick={() => setPresetId(option.id)}
                  >
                    {/* A small box in the shape itself. */}
                    <Box display="flex" alignItems="center" justifyContent="center" h="10">
                      <Box
                        bg={selected ? 'blue.solid' : 'border.emphasized'}
                        borderRadius="xs"
                        aspectRatio={option.width / option.height}
                        {...(option.width >= option.height ? { w: '12' } : { h: '10' })}
                      />
                    </Box>
                    <Text fontSize="sm" fontWeight="medium" lineHeight="short">
                      {option.label}
                      <Text as="span" display="block" fontSize="xs" fontWeight="normal" color="fg.muted">
                        {option.ratio} · up to {option.width} × {option.height}
                      </Text>
                    </Text>
                  </Box>
                )
              })}
            </SimpleGrid>
            {needsCrop && (
              <Field.HelperText>You’ll be asked to crop the image again for the new shape.</Field.HelperText>
            )}
          </Field.Root>

          <Field.Root>
            <Field.Label>Description</Field.Label>
            <Input value={alt} onChange={(event) => setAlt(event.target.value)} />
            <Field.HelperText>
              Describes the image for people using screen readers and for search engines. Not shown on the page.
            </Field.HelperText>
          </Field.Root>

          {extra?.render(extraValues, (name, value) => setExtraValues((current) => ({ ...current, [name]: value })))}
        </Stack>
      </Dialog.Body>
      <Dialog.Footer>
        <Button variant="outline" onClick={onClose} disabled={busy}>
          Cancel
        </Button>
        <Button loading={busy} onClick={apply}>
          {needsCrop ? 'Continue' : 'Apply'}
        </Button>
      </Dialog.Footer>
    </>
  )
}
