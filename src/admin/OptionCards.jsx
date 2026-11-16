import { Box, Field, SimpleGrid, Text } from '@chakra-ui/react'

// A "pick one" setting shown as a row of cards, each with a small picture of the option.
// Used in section settings for things like an image's shape or a text layout.
//
//   label       The setting's name.
//   options     [{ id, label, hint?, preview? }]. `preview` is (selected) => the picture,
//               so it can be drawn in the highlight colour when chosen: see optionColor().
//   value       The id of the chosen option.
//   onChange    Called with the id of the option the user picks.
//   columns     Cards per row (a Chakra responsive value). Defaults to 2, or 3 on wider screens.
//   helperText  Optional note under the cards.
export default function OptionCards({ label, options, value, onChange, columns = { base: 2, sm: 3 }, helperText }) {
  return (
    <Field.Root>
      <Field.Label>{label}</Field.Label>
      <SimpleGrid columns={columns} gap="2" w="full" role="radiogroup" aria-label={label}>
        {options.map((option) => {
          const selected = option.id === value
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
              onClick={() => onChange(option.id)}
            >
              {option.preview && (
                <Box display="flex" alignItems="center" justifyContent="center" h="10" w="full">
                  {option.preview(selected)}
                </Box>
              )}
              <Text fontSize="sm" fontWeight="medium" lineHeight="short">
                {option.label}
                {option.hint && (
                  <Text as="span" display="block" fontSize="xs" fontWeight="normal" color="fg.muted">
                    {option.hint}
                  </Text>
                )}
              </Text>
            </Box>
          )
        })}
      </SimpleGrid>
      {helperText && <Field.HelperText>{helperText}</Field.HelperText>}
    </Field.Root>
  )
}
