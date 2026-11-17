import { Fragment, lazy, Suspense } from 'react'
import { headingLevelOf, isEmptyDoc } from './richText.js'
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
//   headingLevels  On the live site, the element level for each heading in the text, in
//                  order (see headings.js). Without it, headings use their chosen level.
export default function RichText({ value, onChange, placeholder, headingLevels }) {
  // Hands out the element level for each heading as the text is drawn, in order. Made fresh
  // on every draw, and only used while drawing.
  const headingTag = headingCounter(headingLevels)

  const view = <div className="rich-text">{renderNodes(value?.content, headingTag)}</div>
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

// Returns a function that, called once per heading in page order, gives the element level
// to use for it: the next of `levels`, or the chosen level when there are no levels.
function headingCounter(levels) {
  const position = { next: 0 }
  return (chosen) => levels?.[position.next++] ?? chosen
}

function renderNodes(nodes, headingTag) {
  return nodes?.map((node, index) => <Fragment key={index}>{renderNode(node, headingTag)}</Fragment>)
}

// Draws one node of the stored text. Only the kinds the editor can produce are handled;
// anything else is reduced to the text inside it, so nothing unexpected reaches the page.
function renderNode(node, headingTag) {
  const children = renderNodes(node.content, headingTag)
  switch (node.type) {
    case 'paragraph':
      // An empty paragraph is a blank line, as it is in the editor.
      return <p>{children ?? <br />}</p>
    case 'heading': {
      // Styled by the level the editor chose; the element itself may differ (headings.js).
      const chosen = headingLevelOf(node)
      // An empty heading is just a blank line: not something to announce as a heading.
      if (isEmptyDoc(node)) {
        return (
          <p className={`rich-text-h${chosen}`} aria-hidden="true">
            <br />
          </p>
        )
      }
      const Heading = `h${headingTag(chosen)}`
      return <Heading className={`rich-text-h${chosen}`}>{children}</Heading>
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
