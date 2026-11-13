import { Field, NativeSelect } from '@chakra-ui/react'
import { groupOptions } from '../lib/pageTree.js'

// "Inside group" dropdown shared by the page and group dialogs. value is a group id, or '' for
// the top level. Renders nothing when there are no groups to choose from.
export default function ParentGroupSelect({ pages, excludeId, value, onChange }) {
  const options = groupOptions(pages, excludeId)
  if (options.length === 0) return null

  return (
    <Field.Root>
      <Field.Label>Inside group</Field.Label>
      <NativeSelect.Root>
        <NativeSelect.Field value={value} onChange={(e) => onChange(e.target.value)}>
          <option value="">None (top level)</option>
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
