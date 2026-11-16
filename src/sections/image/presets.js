// The shapes an image section can have. An uploaded image is cropped to the chosen shape,
// and saved no larger than the width and height given here (in pixels).
export const IMAGE_PRESETS = [
  { id: 'wide', label: 'Wide', ratio: '16:9', width: 1600, height: 900 },
  { id: 'standard', label: 'Standard', ratio: '4:3', width: 1600, height: 1200 },
  { id: 'square', label: 'Square', ratio: '1:1', width: 1200, height: 1200 },
  { id: 'portrait', label: 'Portrait', ratio: '3:4', width: 1200, height: 1600 },
  { id: 'banner', label: 'Banner', ratio: '3:1', width: 1800, height: 600 },
]

export const DEFAULT_IMAGE_PRESET = 'wide'

export function getImagePreset(id) {
  return IMAGE_PRESETS.find((preset) => preset.id === id) ?? IMAGE_PRESETS[0]
}
