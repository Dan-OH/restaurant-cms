import { Fragment, lazy, Suspense } from 'react'
import './rich-text.css'

// The editor (TipTap, plus its formatting toolbar) is admin UI and by far the heaviest
// part, so it is fetched only when an editor is actually editing.
const RichTextEditor = lazy(() => import('../admin/RichTextEditor.jsx'))

// Formatted text: paragraphs, headings, bold, italics and lists. Section designs use this
// for their main text so editors can write and format it where it appears on the page.
//
//   value        The text, in the format described in richText.js.
//   onChange     Called with the new value on every change. Pass it only while editing;
//                without it this is ordinary, read-only text.
//   placeholder  Shown, faded, while editing and empty.
export default function RichText({ value, onChange, placeholder }) {
  const view = <div className="rich-text">{renderNodes(value?.content)}</div>
  if (!onChange) return view

  return (
    // Until the editor has downloaded, show the text as it normally looks.
    <Suspense fallback={view}>
      <div className="rich-text">
        <RichTextEditor value={value} onChange={onChange} placeholder={placeholder} />
      </div>
    </Suspense>
  )
}

function renderNodes(nodes) {
  return nodes?.map((node, index) => <Fragment key={index}>{renderNode(node)}</Fragment>)
}

// Draws one node of the stored text. Only the kinds the editor can produce are handled;
// anything else is reduced to the text inside it, so nothing unexpected reaches the page.
function renderNode(node) {
  const children = renderNodes(node.content)
  switch (node.type) {
    case 'paragraph':
      // An empty paragraph is a blank line, as it is in the editor.
      return <p>{children ?? <br />}</p>
    case 'heading': {
      const Heading = `h${Math.min(Math.max(Number(node.attrs?.level) || 2, 1), 6)}`
      return <Heading>{children}</Heading>
    }
    case 'bulletList':
      return <ul>{children}</ul>
    case 'orderedList':
      return <ol start={node.attrs?.start ?? 1}>{children}</ol>
    case 'listItem':
      return <li>{children}</li>
    case 'hardBreak':
      return <br />
    case 'text': {
      let text = node.text
      for (const mark of node.marks ?? []) {
        if (mark.type === 'bold') text = <strong>{text}</strong>
        if (mark.type === 'italic') text = <em>{text}</em>
      }
      return text
    }
    default:
      return children ?? null
  }
}
