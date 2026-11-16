import { createSystem, defaultConfig } from '@chakra-ui/react'

// Chakra set up for admin UI that is shown on top of the public site (the editor bar).
//
// The normal Chakra system restyles the whole page: it resets margins, headings and lists,
// and sets the page's font, colours and text-selection colour. On the public site that would
// make pages look different to a logged-in editor than to a visitor. This system applies all
// of that only inside elements with the EMBED_CLASS class and leaves the rest of the page alone.
//
// Note: Chakra renders dialogs, menus and tooltips in a "portal" at the end of <body>, which
// is outside EMBED_CLASS. Before using one of those from embedded UI, give its <Portal> a
// `container` that sits inside an EMBED_CLASS element.
export const EMBED_CLASS = 'admin-embed'

const scope = `.${EMBED_CLASS}`
const { html, '*': everyElement, ...otherRules } = defaultConfig.globalCss
// These are only CSS variables that Chakra's utilities rely on; they don't change how anything looks.
const { fontFeatureSettings, ...variables } = everyElement
// Chakra paints the page background through its html rule; embedded UI sets its own.
const { bg: _pageBackground, ...rootStyles } = html

export const embeddedSystem = createSystem({
  ...defaultConfig,
  preflight: { scope },
  globalCss: {
    '*': variables,
    [scope]: rootStyles,
    [`${scope} *`]: { fontFeatureSettings },
    // Placeholder and text-selection colours, limited to the embedded UI.
    ...Object.fromEntries(
      Object.entries(otherRules).map(([selector, styles]) => [
        selector
          .split(',')
          .map((part) => `${scope} ${part.trim()}`)
          .join(', '),
        styles,
      ]),
    ),
  },
})
