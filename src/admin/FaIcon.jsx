import { Box } from '@chakra-ui/react'
// Each of these only registers a font (a few lines of CSS); the font file is downloaded when first used.
import '@fortawesome/fontawesome-free/css/solid.css'
import '@fortawesome/fontawesome-free/css/regular.css'

const FONT_WEIGHTS = { solid: 900, regular: 400 }

// Shows a Font Awesome Free icon from its unicode value, e.g. <FaIcon code="f35d" />.
// Look codes up at https://fontawesome.com/search?ic=free (shown on each icon's page).
//
// - variant: "solid" (default) or "regular" (the outline style; only some icons have it).
// - label: text for screen readers. Leave it out when the icon sits next to visible text.
// - Any Chakra style prop works, e.g. fontSize="lg" or color="fg.muted". By default the
//   icon takes the size and colour of the surrounding text.
export default function FaIcon({ code, variant = 'solid', label, ...styleProps }) {
  return (
    <Box
      as="span"
      display="inline-block"
      fontFamily="var(--fa-family-classic)"
      fontWeight={FONT_WEIGHTS[variant] ?? FONT_WEIGHTS.solid}
      fontStyle="normal"
      lineHeight="1"
      textAlign="center"
      css={{ WebkitFontSmoothing: 'antialiased', MozOsxFontSmoothing: 'grayscale' }}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      {...styleProps}
    >
      {String.fromCodePoint(Number.parseInt(code, 16))}
    </Box>
  )
}
