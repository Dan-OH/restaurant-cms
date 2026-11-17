import { useState } from 'react'
import { Badge, Box, Button, Center, CloseButton, Dialog, Flex, Heading, HStack, Link, Stack, Text } from '@chakra-ui/react'
import { VIEWABLE_TYPES, formatBytes, formatDate } from '../lib/assets.js'
import { imageUrl } from '../lib/images.js'
import { IMAGE_PRESETS } from '../sections/imagePresets.js'
import AdminPortal from './AdminPortal.jsx'
import ExternalLinkButton from './ExternalLinkButton.jsx'
import FaIcon from './FaIcon.jsx'

// The details of one asset (see lib/assets.js): the original with the part each crop kept
// outlined on it, and a list of the crops with their shape and where they are used.
// `onDelete` is called when the user asks to delete it (DeleteAssetDialog then confirms).
export default function AssetDialog({ open, asset, onClose, onDelete }) {
  return (
    <Dialog.Root size="xl" open={open} onOpenChange={(e) => !e.open && onClose()} lazyMount unmountOnExit>
      <AdminPortal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            {asset && <AssetDetails asset={asset} onClose={onClose} onDelete={onDelete} />}
            <Dialog.CloseTrigger asChild>
              <CloseButton size="sm" />
            </Dialog.CloseTrigger>
          </Dialog.Content>
        </Dialog.Positioner>
      </AdminPortal>
    </Dialog.Root>
  )
}

function AssetDetails({ asset, onClose, onDelete }) {
  // The crop being pointed at in the list, highlighted on the original.
  const [highlight, setHighlight] = useState(null)
  const details = [
    asset.width && `${asset.width} × ${asset.height} px`,
    formatBytes(asset.size_bytes),
    `Uploaded ${formatDate(asset.created_at)}`,
  ].filter(Boolean)

  return (
    <>
      <Dialog.Header>
        <Stack gap="1" minW="0">
          <Dialog.Title truncate>{asset.file_name || 'Untitled image'}</Dialog.Title>
          <Text fontSize="sm" color="fg.muted">
            {details.join(' · ')}
          </Text>
        </Stack>
      </Dialog.Header>
      <Dialog.Body>
        <Stack gap="6">
          <Original asset={asset} highlight={highlight} />

          <Stack gap="3">
            <Heading as="h3" size="sm">
              Crops
            </Heading>
            {asset.crops.length === 0 && (
              <Text fontSize="sm" color="fg.muted">
                This image was uploaded but never cropped.
              </Text>
            )}
            {asset.crops.map((crop, index) => (
              <CropRow
                key={crop.id}
                crop={crop}
                number={index + 1}
                onPoint={(pointing) => setHighlight(pointing ? crop.id : null)}
              />
            ))}
          </Stack>
        </Stack>
      </Dialog.Body>
      <Dialog.Footer>
        <Button variant="ghost" colorPalette="red" me="auto" onClick={onDelete}>
          Delete
          {/* f2ed = trash can */}
          <FaIcon code="f2ed" />
        </Button>
        <ExternalLinkButton href={imageUrl(asset.original_path)} variant="outline">
          Open original
        </ExternalLinkButton>
        <Button onClick={onClose}>Close</Button>
      </Dialog.Footer>
    </>
  )
}

// The uploaded file as it is, with a numbered outline for each crop over the part it kept.
function Original({ asset, highlight }) {
  // The image's own size, needed to place the outlines; read from the file once it loads,
  // since images uploaded before the asset list existed don't have it recorded.
  const [size, setSize] = useState(asset.width ? { width: asset.width, height: asset.height } : null)
  const [failed, setFailed] = useState(false)
  const outlined = asset.crops.map((crop, index) => ({ crop, number: index + 1 })).filter(({ crop }) => crop.area)

  if (failed || !VIEWABLE_TYPES.includes(asset.mime_type ?? 'image/jpeg')) {
    return (
      <Text fontSize="sm" color="fg.muted">
        The original can’t be previewed in the browser. Use “Open original” to download it.
      </Text>
    )
  }

  return (
    <Stack gap="2">
      <Center>
        {/* Shrink-wraps the image, so percentages below are of the image itself. */}
        <Box position="relative" display="inline-block" maxW="full" lineHeight="0">
          <Box
            as="img"
            src={imageUrl(asset.original_path)}
            alt=""
            maxW="full"
            maxH="24rem"
            borderRadius="md"
            onLoad={(event) => setSize({ width: event.target.naturalWidth, height: event.target.naturalHeight })}
            onError={() => setFailed(true)}
          />
          {size &&
            outlined.map(({ crop, number }) => {
              const active = highlight === crop.id
              return (
                <Box
                  key={crop.id}
                  position="absolute"
                  left={`${(crop.area.x / size.width) * 100}%`}
                  top={`${(crop.area.y / size.height) * 100}%`}
                  w={`${(crop.area.width / size.width) * 100}%`}
                  h={`${(crop.area.height / size.height) * 100}%`}
                  border="2px solid"
                  borderColor={active ? 'blue.solid' : 'white'}
                  boxShadow="0 0 0 1px rgba(0, 0, 0, 0.5)"
                  bg={active ? 'blue.solid/20' : undefined}
                  opacity={highlight && !active ? 0.35 : 1}
                  transition="opacity 0.15s"
                  pointerEvents="none"
                >
                  <Badge position="absolute" top="1" left="1" size="sm" variant="solid" colorPalette={active ? 'blue' : 'gray'}>
                    {number}
                  </Badge>
                </Box>
              )
            })}
        </Box>
      </Center>
      {outlined.length < asset.crops.length && (
        <Text fontSize="xs" color="fg.muted" textAlign="center">
          Crops made before the asset list existed have no outline, as which part they kept wasn’t recorded.
        </Text>
      )}
    </Stack>
  )
}

function CropRow({ crop, number, onPoint }) {
  const preset = IMAGE_PRESETS.find((option) => option.id === crop.preset)
  const facts = [
    crop.width && `Saved at ${crop.width} × ${crop.height} px`,
    crop.area && `Kept ${crop.area.width} × ${crop.area.height} px from ${crop.area.x}, ${crop.area.y}`,
    `Cropped ${formatDate(crop.created_at)}`,
  ].filter(Boolean)

  return (
    <Flex
      gap="3"
      p="2"
      borderWidth="1px"
      borderRadius="md"
      align="center"
      onPointerEnter={() => onPoint(true)}
      onPointerLeave={() => onPoint(false)}
    >
      <Badge variant="solid" colorPalette="gray" flexShrink="0">
        {number}
      </Badge>
      <Box
        as="img"
        src={imageUrl(crop.path)}
        alt=""
        loading="lazy"
        w="20"
        h="14"
        objectFit="contain"
        bg="bg.muted"
        borderRadius="sm"
        flexShrink="0"
      />
      <Stack gap="1" flex="1" minW="0">
        <HStack gap="2" wrap="wrap">
          <Text fontWeight="medium" fontSize="sm">
            {preset ? `${preset.label} (${preset.ratio})` : 'Shape not recorded'}
          </Text>
          {crop.usedOn.length === 0 && (
            <Badge colorPalette="orange" variant="subtle" size="sm">
              Not in use
            </Badge>
          )}
        </HStack>
        <Text fontSize="xs" color="fg.muted">
          {facts.join(' · ')}
        </Text>
        {crop.usedOn.length > 0 && (
          <HStack gap="1" wrap="wrap" fontSize="xs">
            <Text color="fg.muted">Used on</Text>
            {crop.usedOn.map((page, index) => (
              <Text as="span" key={page.id}>
                <Link href={page.path} target="_blank" rel="noreferrer" color="colorPalette.fg" colorPalette="blue">
                  {page.title}
                  <FaIcon code="f35d" label="(opens in a new window)" fontSize="0.8em" />
                </Link>
                {!page.published && (
                  <Text as="span" color="fg.muted">
                    {' '}
                    (draft)
                  </Text>
                )}
                {index < crop.usedOn.length - 1 && ','}
              </Text>
            ))}
          </HStack>
        )}
      </Stack>
    </Flex>
  )
}
