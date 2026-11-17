import { useState } from 'react'
import { Alert, Box, Button, Dialog, Stack, Text } from '@chakra-ui/react'
import AltTextField from '../../admin/AltTextField.jsx'
import FaIcon from '../../admin/FaIcon.jsx'
import ImageCropper from '../../admin/ImageCropper.jsx'
import OptionCards from '../../admin/OptionCards.jsx'
import { optionColor } from '../../admin/optionColor.js'
import { downloadOriginal, uploadCrop } from '../../lib/images.js'
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
      const cropped = await uploadCrop(content.original, original, area, preset)
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

          <OptionCards
            label="Shape"
            value={presetId}
            onChange={setPresetId}
            options={IMAGE_PRESETS.map((option) => ({
              id: option.id,
              label: option.label,
              hint: `${option.ratio} · up to ${option.width} × ${option.height}`,
              // A small box in the shape itself.
              preview: (selected) => (
                <Box
                  bg={optionColor(selected)}
                  borderRadius="xs"
                  aspectRatio={option.width / option.height}
                  {...(option.width >= option.height ? { w: '12' } : { h: '10' })}
                />
              ),
            }))}
            helperText={needsCrop ? 'You’ll be asked to crop the image again for the new shape.' : undefined}
          />

          <AltTextField value={alt} onChange={setAlt} />

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
