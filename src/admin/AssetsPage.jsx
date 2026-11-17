import { useCallback, useEffect, useMemo, useState } from 'react'
import { Alert, Badge, Box, Button, Center, Flex, Heading, HStack, SimpleGrid, Spinner, Stack, Text } from '@chakra-ui/react'
import { formatBytes, formatDate, loadAssets, previewPath } from '../lib/assets.js'
import { imageUrl } from '../lib/images.js'
import AssetDialog from './AssetDialog.jsx'
import DeleteAssetDialog from './DeleteAssetDialog.jsx'
import FaIcon from './FaIcon.jsx'

const FILTERS = [
  { id: 'all', label: 'All', test: () => true },
  { id: 'used', label: 'In use', test: (asset) => asset.usedOn.length > 0 },
  { id: 'unused', label: 'Not in use', test: (asset) => asset.usedOn.length === 0 },
]

// Every image uploaded to the site. Each card is one uploaded file; its crops (one per
// shape it has been cut to) are part of it rather than separate images. Images are uploaded
// and cropped in the page editor; this page shows them and where they are used.
export default function AssetsPage() {
  const [assets, setAssets] = useState(null)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all')
  // The asset open in the dialog. Kept while the dialog closes so it doesn't empty mid-animation.
  const [selected, setSelected] = useState({ open: false, asset: null })
  // Whether the delete confirmation is open, over the details of `selected.asset`.
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(
    () =>
      loadAssets().then(setAssets, (problem) =>
        setError(
          problem.message.includes('assets')
            ? `${problem.message}. Has migration 006 (supabase/migrations/006_assets.sql) been run?`
            : problem.message,
        ),
      ),
    [],
  )

  useEffect(() => {
    load()
  }, [load])

  const shown = useMemo(() => {
    const test = FILTERS.find((option) => option.id === filter).test
    return assets?.filter(test) ?? []
  }, [assets, filter])

  return (
    <Box>
      <Flex justify="space-between" align="center" gap="4" mb="6" wrap="wrap">
        <Heading size="2xl">Assets</Heading>
        {assets?.length > 0 && (
          <HStack gap="1" role="group" aria-label="Show">
            {FILTERS.map((option) => (
              <Button
                key={option.id}
                size="sm"
                variant={filter === option.id ? 'subtle' : 'ghost'}
                aria-pressed={filter === option.id}
                onClick={() => setFilter(option.id)}
              >
                {option.label}
                <Badge size="sm" variant="outline">
                  {assets.filter(option.test).length}
                </Badge>
              </Button>
            ))}
          </HStack>
        )}
      </Flex>

      {error && (
        <Alert.Root status="error" mb="4">
          <Alert.Indicator />
          <Alert.Title>{error}</Alert.Title>
        </Alert.Root>
      )}

      {!assets && !error && (
        <Center py="16">
          <Spinner />
        </Center>
      )}

      {assets?.length === 0 && (
        <Box bg="bg" borderWidth="1px" borderRadius="lg" p="10" textAlign="center">
          <Text color="fg.muted">
            No images yet. Images are uploaded in the page editor, by adding an image section to a page.
          </Text>
        </Box>
      )}

      {assets?.length > 0 && shown.length === 0 && (
        <Text color="fg.muted" py="6">
          No images here.
        </Text>
      )}

      <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} gap="4">
        {shown.map((asset) => (
          <AssetCard key={asset.id} asset={asset} onOpen={() => setSelected({ open: true, asset })} />
        ))}
      </SimpleGrid>

      <AssetDialog
        open={selected.open}
        asset={selected.asset}
        onClose={() => setSelected((current) => ({ ...current, open: false }))}
        onDelete={() => setDeleting(true)}
      />

      <DeleteAssetDialog
        open={deleting}
        asset={selected.asset}
        onClose={() => setDeleting(false)}
        onDeleted={() => {
          setDeleting(false)
          setSelected((current) => ({ ...current, open: false }))
          load()
        }}
      />
    </Box>
  )
}

function AssetCard({ asset, onOpen }) {
  const preview = previewPath(asset)
  const details = [asset.width && `${asset.width} × ${asset.height}`, formatBytes(asset.size_bytes)].filter(Boolean)

  return (
    <Box
      as="button"
      type="button"
      onClick={onOpen}
      textAlign="start"
      bg="bg"
      borderWidth="1px"
      borderRadius="lg"
      overflow="hidden"
      cursor="pointer"
      transition="box-shadow 0.15s, border-color 0.15s"
      _hover={{ shadow: 'md', borderColor: 'border.emphasized' }}
      _focusVisible={{ outline: '2px solid', outlineColor: 'colorPalette.focusRing', outlineOffset: '2px' }}
    >
      <Center aspectRatio={4 / 3} bg="bg.muted">
        {preview ? (
          <Box as="img" src={imageUrl(preview)} alt="" loading="lazy" w="full" h="full" objectFit="cover" />
        ) : (
          // f03e = image
          <FaIcon code="f03e" fontSize="2xl" color="fg.subtle" />
        )}
      </Center>
      <Stack gap="1.5" p="3">
        <Text fontWeight="medium" truncate title={asset.file_name ?? undefined}>
          {asset.file_name || 'Untitled image'}
        </Text>
        <Text fontSize="xs" color="fg.muted">
          {[...details, `Uploaded ${formatDate(asset.created_at)}`].join(' · ')}
        </Text>
        <HStack gap="2" wrap="wrap">
          <Badge variant="subtle">
            {asset.crops.length} {asset.crops.length === 1 ? 'crop' : 'crops'}
          </Badge>
          {asset.usedOn.length > 0 ? (
            <Badge colorPalette="green" variant="subtle" maxW="full">
              <Text as="span" truncate>
                Used on {asset.usedOn.map((page) => page.title).join(', ')}
              </Text>
            </Badge>
          ) : (
            <Badge colorPalette="orange" variant="subtle">
              Not in use
            </Badge>
          )}
        </HStack>
      </Stack>
    </Box>
  )
}
