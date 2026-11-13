import { Button } from '@chakra-ui/react'
import FaIcon from './FaIcon.jsx'

// Use this for every button that opens a new window or leaves the admin,
// so they all carry the external-link icon. Accepts any Button props.
export default function ExternalLinkButton({ href, children, ...buttonProps }) {
  return (
    <Button asChild {...buttonProps}>
      <a href={href} target="_blank" rel="noreferrer">
        {children}
        <FaIcon code="f35d" label="(opens in a new window)" fontSize="0.85em" />
      </a>
    </Button>
  )
}
