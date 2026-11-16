import { useState } from 'react'
import { Box, HStack, Slider, Text } from '@chakra-ui/react'
import Cropper from 'react-easy-crop'
import FaIcon from './FaIcon.jsx'

// A browser address for showing an image file that hasn't been uploaded (or has just been
// downloaded). Made once per file and kept for the rest of the visit.
const previewUrls = new WeakMap()
function previewUrl(blob) {
  if (!previewUrls.has(blob)) previewUrls.set(blob, URL.createObjectURL(blob))
  return previewUrls.get(blob)
}

// Lets the user choose which part of an image to keep: drag to move, slide to zoom.
//
//   source        The image file (a File or Blob).
//   preset        The shape to crop to: { width, height, label, ratio }.
//   onAreaChange  Called with the chosen part, { x, y, width, height } in the image's own
//                 pixels, whenever it changes. Pass that to cropImage() in lib/images.js.
export default function ImageCropper({ source, preset, onAreaChange }) {
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)

  return (
    <Box>
      <Box position="relative" h={{ base: '16rem', md: '22rem' }} bg="gray.900" borderRadius="md" overflow="hidden">
        <Cropper
          image={previewUrl(source)}
          crop={position}
          zoom={zoom}
          maxZoom={4}
          aspect={preset.width / preset.height}
          onCropChange={setPosition}
          onZoomChange={setZoom}
          onCropComplete={(_area, areaInPixels) => onAreaChange(areaInPixels)}
        />
      </Box>

      <HStack gap="3" mt="4">
        {/* f010 = zoom out, f00e = zoom in */}
        <FaIcon code="f010" color="fg.muted" />
        <Slider.Root
          flex="1"
          size="sm"
          min={1}
          max={4}
          step={0.01}
          value={[zoom]}
          onValueChange={(details) => setZoom(details.value[0])}
          aria-label={['Zoom']}
        >
          <Slider.Control>
            <Slider.Track>
              <Slider.Range />
            </Slider.Track>
            <Slider.Thumbs />
          </Slider.Control>
        </Slider.Root>
        <FaIcon code="f00e" color="fg.muted" />
      </HStack>

      <Text mt="3" fontSize="sm" color="fg.muted">
        Drag the image to position it and use the slider to zoom. Shape: {preset.label} ({preset.ratio}).
      </Text>
    </Box>
  )
}
