import { Box, Field, SimpleGrid, Text } from '@chakra-ui/react'
import ImageSettings from '../image/ImageSettings.jsx'

const SIDES = [
  { id: 'left', label: 'Image on the left' },
  { id: 'right', label: 'Image on the right' },
]

// Settings for the image-and-text section: everything the image section offers (shape and
// description, with re-cropping when the shape changes), plus which side the image is on.
export default function ImageTextSettings({ content, onChange, onClose }) {
  return (
    <ImageSettings
      content={content}
      onChange={onChange}
      onClose={onClose}
      extra={{
        initial: { imageSide: content.imageSide === 'right' ? 'right' : 'left' },
        render: (values, setValue) => (
          <Field.Root>
            <Field.Label>Layout</Field.Label>
            <SimpleGrid columns={2} gap="2" w="full" role="radiogroup" aria-label="Layout">
              {SIDES.map((side) => {
                const selected = values.imageSide === side.id
                return (
                  <Box
                    as="button"
                    type="button"
                    key={side.id}
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
                    onClick={() => setValue('imageSide', side.id)}
                  >
                    {/* A small diagram: a filled block for the image, lines for the text. */}
                    <Box display="flex" flexDirection={side.id === 'left' ? 'row' : 'row-reverse'} gap="2" h="8">
                      <Box w="10" borderRadius="xs" bg={selected ? 'blue.solid' : 'border.emphasized'} />
                      <Box display="flex" flexDirection="column" justifyContent="center" gap="1" w="10">
                        <Box h="1" borderRadius="full" bg="border.emphasized" />
                        <Box h="1" borderRadius="full" bg="border.emphasized" />
                        <Box h="1" w="6" borderRadius="full" bg="border.emphasized" />
                      </Box>
                    </Box>
                    <Text fontSize="sm" fontWeight="medium">
                      {side.label}
                    </Text>
                  </Box>
                )
              })}
            </SimpleGrid>
            <Field.HelperText>On phones the image always sits above the text.</Field.HelperText>
          </Field.Root>
        ),
      }}
    />
  )
}
