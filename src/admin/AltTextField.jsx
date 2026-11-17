import { Field, Text, Textarea } from '@chakra-ui/react'

// Past this many characters, a hint suggests keeping the description shorter: screen readers
// read it all out, and can't skip ahead within it.
const LONG = 150

// The field for an image's description (alt text), with an explanation of what it is for.
// Used wherever an image is uploaded or edited, so it always reads the same.
//
//   value, onChange   The text; onChange gets the new string.
//   note              Extra line under the explanation, e.g. that the image already had one.
//   autoFocus         Put the cursor in it straight away.
export default function AltTextField({ value, onChange, note, autoFocus }) {
  const long = value.trim().length > LONG

  return (
    <Field.Root>
      <Field.Label>
        Description (alt text)
        <Text as="span" fontWeight="normal" color="fg.muted">
          · Optional
        </Text>
      </Field.Label>
      <Textarea
        autoresize
        rows={2}
        maxH="10rem"
        value={value}
        autoFocus={autoFocus}
        placeholder="e.g. Grilled salmon on a bed of greens, with a lemon wedge"
        onChange={(event) => onChange(event.target.value)}
      />
      <Field.HelperText>
        Describe what the image shows, in a sentence. It is read out to people using screen readers, shown if the
        image fails to load, and helps search engines. Leave it blank if the image is only decoration, so screen
        readers skip it. It is used everywhere this image appears.
      </Field.HelperText>
      {long && (
        <Text fontSize="xs" color="fg.muted">
          This is quite long. A sentence or two is usually best.
        </Text>
      )}
      {note && (
        <Text fontSize="xs" color="fg.muted">
          {note}
        </Text>
      )}
    </Field.Root>
  )
}
