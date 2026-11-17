import { useState } from 'react'
import { Box, Button, Dialog, Stack } from '@chakra-ui/react'
import OptionCards from '../../admin/OptionCards.jsx'
import { optionColor } from '../../admin/optionColor.js'
import { TEXT_LAYOUTS, TEXT_WIDTHS, getTextLayout, getTextWidth } from './layouts.js'

// The text section's settings, shown inside the settings dialog (see src/sections/index.js):
// how many columns it has and, for a single column, how wide it is. (The heading's level is
// chosen on the page itself, from the toolbar above the heading.)
export default function TextSettings({ content, onChange, onClose }) {
  const [layoutId, setLayoutId] = useState(getTextLayout(content.layout).id)
  const [widthId, setWidthId] = useState(getTextWidth(content.width).id)

  const single = getTextLayout(layoutId).columns.length === 1
  const fewerColumns = getTextLayout(layoutId).columns.length < getTextLayout(content.layout).columns.length

  function apply() {
    onChange('layout', layoutId)
    onChange('width', widthId)
    onClose()
  }

  return (
    <>
      <Dialog.Body>
        <Stack gap="5">
          <OptionCards
            label="Layout"
            value={layoutId}
            onChange={setLayoutId}
            options={TEXT_LAYOUTS.map((layout) => ({
              id: layout.id,
              label: layout.label,
              hint: layout.hint,
              // A small diagram of the columns at their relative widths.
              preview: (selected) => (
                <Box display="flex" gap="1" w="16" h="8">
                  {layout.columns.map((width, index) => (
                    <Box key={index} flex={width} borderRadius="xs" bg={optionColor(selected)} />
                  ))}
                </Box>
              ),
            }))}
            helperText={
              fewerColumns
                ? 'Text in the columns being removed is hidden, not deleted. It comes back if you add the columns again.'
                : 'On phones the columns stack one above the other.'
            }
          />

          {single && (
            <OptionCards
              label="Width"
              value={widthId}
              onChange={setWidthId}
              options={TEXT_WIDTHS.map((width, index) => ({
                id: width.id,
                label: width.label,
                // A bar that gets wider with each option.
                preview: (selected) => (
                  <Box w={['8', '12', '16'][index]} h="8" borderRadius="xs" bg={optionColor(selected)} />
                ),
              }))}
            />
          )}

        </Stack>
      </Dialog.Body>
      <Dialog.Footer>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={apply}>Apply</Button>
      </Dialog.Footer>
    </>
  )
}
