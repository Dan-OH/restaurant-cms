import { Portal } from '@chakra-ui/react'
import { usePortalContainer } from './portalContainer.js'

// Use this instead of Chakra's <Portal> in admin components, so they also work when shown
// on the public site from the editor bar. See portalContainer.js.
export default function AdminPortal({ children }) {
  const container = usePortalContainer()
  return <Portal container={container ? { current: container } : undefined}>{children}</Portal>
}
