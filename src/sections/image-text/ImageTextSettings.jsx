import { Box } from '@chakra-ui/react'
import OptionCards from '../../admin/OptionCards.jsx'
import { optionColor } from '../../admin/optionColor.js'
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
          <OptionCards
            label="Layout"
            columns={2}
            value={values.imageSide}
            onChange={(side) => setValue('imageSide', side)}
            helperText="On phones the image always sits above the text."
            options={SIDES.map((side) => ({
              ...side,
              // A small diagram: a filled block for the image, lines for the text.
              preview: (selected) => (
                <Box display="flex" flexDirection={side.id === 'left' ? 'row' : 'row-reverse'} gap="2" h="8">
                  <Box w="10" borderRadius="xs" bg={optionColor(selected)} />
                  <Box display="flex" flexDirection="column" justifyContent="center" gap="1" w="10">
                    <Box h="1" borderRadius="full" bg="border.emphasized" />
                    <Box h="1" borderRadius="full" bg="border.emphasized" />
                    <Box h="1" w="6" borderRadius="full" bg="border.emphasized" />
                  </Box>
                </Box>
              ),
            }))}
          />
        ),
      }}
    />
  )
}
