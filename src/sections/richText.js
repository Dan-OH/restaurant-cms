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

// The level chosen for a heading node in the editor (1 to 6).
export function headingLevelOf(node) {
  return Math.min(Math.max(Number(node.attrs?.level) || 2, 1), 6)
}

// The chosen levels of the headings in a document, in the order they appear. Empty
// headings are left out: they aren't drawn as headings (see RichText.jsx).
export function richTextHeadings(doc) {
  const levels = []
  function walk(node) {
    if (node.type === 'heading') {
      if (!isEmptyDoc(node)) levels.push(headingLevelOf(node))
      return
    }
    node.content?.forEach(walk)
  }
  if (doc) walk(doc)
  return levels
}
