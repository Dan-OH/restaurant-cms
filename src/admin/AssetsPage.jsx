import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Badge,
  Box,
  Button,
  Center,
  CloseButton,
  Field,
  Flex,
  Heading,
  HStack,
  Input,
  InputGroup,
  NativeSelect,
  SimpleGrid,
  Spinner,
  Stack,
  Text,
} from '@chakra-ui/react'
import { useSearchParams } from 'react-router-dom'
import { formatBytes, formatDate, loadAssets, previewPath } from '../lib/assets.js'
import { imageUrl } from '../lib/images.js'
import AssetDialog from './AssetDialog.jsx'
import {
  DEFAULTS,
  SORTS,
  USAGE_FILTERS,
  applyUsage,
  filterAssets,
  groupByPage,
  pagesInUse,
  readQuery,
  shapesInUse,
  sortAssets,
} from './assetQuery.js'
import DeleteAssetDialog from './DeleteAssetDialog.jsx'
import FaIcon from './FaIcon.jsx'

// Every image uploaded to the site. Each card is one uploaded file; its crops (one per
// shape it has been cut to) are part of it rather than separate images. Images are uploaded
// and cropped in the page editor; this page shows them and where they are used, and can be
// searched, filtered and sorted (see assetQuery.js).
export default function AssetsPage() {
  const [assets, setAssets] = useState(null)
  const [error, setError] = useState('')
  const [params, setParams] = useSearchParams()
  const query = readQuery(params)
  // The asset open in the dialog. Kept while the dialog closes so it doesn't empty mid-animation.
  const [selected, setSelected] = useState({ open: false, asset: null })
  // Whether the delete confirmation is open, over the details of `selected.asset`.
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(
    () =>
      loadAssets().then(setAssets, (problem) =>
        setError(
          problem.message.includes('assets')
            ? `${problem.message}. Have migrations 006 and 007 (in supabase/migrations/) been run?`
            : problem.message,
        ),
      ),
    [],
  )

  useEffect(() => {
    load()
  }, [load])

  // Changes one choice, keeping the others. Defaults are left out of the address.
  function setChoice(name, value) {
    setParams(
      (current) => {
        const next = new URLSearchParams(current)
        if (value === DEFAULTS[name]) next.delete(name)
        else next.set(name, value)
        return next
      },
      { replace: true },
    )
  }

  const all = useMemo(() => assets ?? [], [assets])
  const pages = useMemo(() => pagesInUse(all), [all])
  const shapes = useMemo(() => shapesInUse(all), [all])
  // A page in the address that no image is used on any more (e.g. after deleting) is ignored.
  const { q, shape, usage, sort } = query
  const page = pages.some((option) => option.id === query.page) ? query.page : ''
  // Filtered by everything but usage, so each usage button can show its count.
  const filtered = useMemo(() => filterAssets(all, { q, page, shape }), [all, q, page, shape])
  const shown = useMemo(() => sortAssets(applyUsage(filtered, usage), sort), [filtered, usage, sort])
  const grouped = SORTS.find((option) => option.id === query.sort).grouped
  const filtering = Boolean(q || page || shape || usage !== DEFAULTS.usage)

  const open = (asset) => setSelected({ open: true, asset })

  return (
    <Box>
      <Flex justify="space-between" align="center" gap="4" mb="6" wrap="wrap">
        <Heading size="2xl">Assets</Heading>
        {all.length > 0 && (
          <HStack gap="1" role="group" aria-label="Show">
            {USAGE_FILTERS.map((option) => (
              <Button
                key={option.id}
                size="sm"
                variant={query.usage === option.id ? 'subtle' : 'ghost'}
                aria-pressed={query.usage === option.id}
                onClick={() => setChoice('usage', option.id)}
              >
                {option.label}
                <Badge size="sm" variant="outline">
                  {applyUsage(filtered, option.id).length}
                </Badge>
              </Button>
            ))}
          </HStack>
        )}
      </Flex>

      {all.length > 0 && (
        <Flex gap="3" mb="6" wrap="wrap" align="flex-end">
          <Field.Root flex="2" minW="12rem">
            <Field.Label>Search</Field.Label>
            <InputGroup
              // f002 = magnifying glass
              startElement={<FaIcon code="f002" color="fg.muted" />}
              endElement={
                query.q ? (
                  <CloseButton size="xs" me="-2" aria-label="Clear search" onClick={() => setChoice('q', '')} />
                ) : undefined
              }
            >
              <Input
                bg="bg"
                placeholder="File name"
                value={query.q}
                onChange={(event) => setChoice('q', event.target.value)}
              />
            </InputGroup>
          </Field.Root>

          <Choice
            label="Page"
            value={page}
            onChange={(value) => setChoice('page', value)}
            options={[
              { id: '', label: 'Any page' },
              ...pages.map((page) => ({ id: page.id, label: `${page.title}${page.published ? '' : ' (draft)'}` })),
            ]}
          />
          <Choice
            label="Shape"
            value={query.shape}
            onChange={(value) => setChoice('shape', value)}
            options={[{ id: '', label: 'Any shape' }, ...shapes]}
          />
          <Choice
            label="Sort by"
            value={query.sort}
            onChange={(value) => setChoice('sort', value)}
            options={SORTS}
          />
        </Flex>
      )}

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

      {all.length > 0 && shown.length === 0 && (
        <Stack align="center" gap="3" py="10" bg="bg" borderWidth="1px" borderRadius="lg">
          <Text color="fg.muted">No images match these filters.</Text>
          {filtering && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setParams(sort === DEFAULTS.sort ? {} : { sort }, { replace: true })}
            >
              Clear filters
            </Button>
          )}
        </Stack>
      )}

      {grouped ? (
        <Stack gap="8">
          {groupByPage(shown, page).map((group) => (
            <Box as="section" key={group.key} aria-labelledby={`assets-${group.key}`}>
              <HStack gap="2" mb="3" align="baseline" wrap="wrap">
                <Heading as="h2" size="md" id={`assets-${group.key}`}>
                  {group.page ? group.page.title : 'Not in use'}
                </Heading>
                {group.page && (
                  <Text fontSize="sm" color="fg.muted">
                    {group.page.path}
                    {!group.page.published && ' · draft'}
                  </Text>
                )}
                <Badge size="sm" variant="outline">
                  {group.assets.length}
                </Badge>
              </HStack>
              <AssetGrid assets={group.assets} onOpen={open} />
            </Box>
          ))}
        </Stack>
      ) : (
        <AssetGrid assets={shown} onOpen={open} />
      )}

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

// A labelled drop-down. `options` are [{ id, label }].
function Choice({ label, value, onChange, options }) {
  return (
    <Field.Root flex="1" minW="10rem">
      <Field.Label>{label}</Field.Label>
      <NativeSelect.Root>
        <NativeSelect.Field bg="bg" value={value} onChange={(event) => onChange(event.target.value)}>
          {options.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </NativeSelect.Field>
        <NativeSelect.Indicator />
      </NativeSelect.Root>
    </Field.Root>
  )
}

function AssetGrid({ assets, onOpen }) {
  return (
    <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} gap="4">
      {assets.map((asset) => (
        <AssetCard key={asset.id} asset={asset} onOpen={() => onOpen(asset)} />
      ))}
    </SimpleGrid>
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
