import { createContext, useContext } from 'react'

// Where admin dialogs and tooltips are rendered. null means Chakra's default, the end of
// <body>, which is right for the dashboard. The editor bar on the public site provides an
// element of its own instead, so that its dialogs sit inside the area Chakra's styles are
// confined to (see embeddedSystem.js).
export const PortalContainerContext = createContext(null)

export function usePortalContainer() {
  return useContext(PortalContainerContext)
}
