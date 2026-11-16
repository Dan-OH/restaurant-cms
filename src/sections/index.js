// The section library: the kinds of section a page can be built from.
//
// Every folder in src/sections/ with an index.js is picked up automatically. To add a new
// kind of section, copy the text/ folder, rename it, and change its index.js. Each index.js
// default-exports a definition:
//
//   type            Unique id, saved with each section in the database. Never change it
//                   once it is in use, or existing sections of that type stop showing.
//   label           Name shown to editors in the library and the page editor.
//   description     One line shown under the name in the library.
//   defaultContent  The content a newly added section starts with.
//   Render          React component that draws the section, on the public site and in the
//                   page editor alike. It receives:
//                     content   The section's saved values.
//                     onChange  Only while the page is being edited: onChange(name, value)
//                               stores value as content[name]. Hand it to <RichText>
//                               (formatted text) or <EditableText> (plain text) to let
//                               editors type into the section where it appears.
//                   Plain HTML and CSS only: it must not use Chakra, because visitors
//                   never load it. Editing-only parts that need Chakra (see image/) go
//                   in a separate file loaded with lazy(), and only when onChange is given.
//   Settings        Optional. Options that can't be edited in place. When present, the
//                   section gets a settings button while editing, which opens a dialog
//                   showing this component. It is admin UI, so it may use Chakra, but it
//                   must be loaded with lazy(). It receives { content, onChange, onClose }
//                   and draws the dialog's body and footer.
const modules = import.meta.glob('./*/index.js', { eager: true })

export const SECTION_TYPES = Object.values(modules)
  .map((module) => module.default)
  .sort((a, b) => a.label.localeCompare(b.label))

export function getSectionType(type) {
  return SECTION_TYPES.find((definition) => definition.type === type)
}
