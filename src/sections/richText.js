// Formatted text is stored as a small tree (the editor's own JSON format) rather than as
// HTML: { type: 'doc', content: [ { type: 'paragraph', content: [ { type: 'text', ... } ] } ] }.
// The site draws it itself (RichText.jsx) and never injects stored HTML into the page.

// Turns plain text into that format: a blank line starts a new paragraph and a single
// line break stays a line break. Used for text written before formatting existed.
export function textToDoc(text) {
  const paragraphs = (text ?? '')
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) => ({
      type: 'paragraph',
      content: paragraph
        .split('\n')
        .flatMap((line, index) => [
          ...(index > 0 ? [{ type: 'hardBreak' }] : []),
          ...(line ? [{ type: 'text', text: line }] : []),
        ]),
    }))
  return { type: 'doc', content: paragraphs.length ? paragraphs : [{ type: 'paragraph' }] }
}

// True when there is no actual text anywhere in the document.
export function isEmptyDoc(node) {
  if (!node) return true
  if (node.type === 'text') return !node.text?.trim()
  return (node.content ?? []).every(isEmptyDoc)
}
