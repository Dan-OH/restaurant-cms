import { useEffect, useRef, useState } from 'react'
import { Separator } from '@chakra-ui/react'
import { Placeholder } from '@tiptap/extensions'
import { EditorContent, useEditor, useEditorState } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import FaIcon from './FaIcon.jsx'
import FloatingToolbar, { ToolbarButton } from './FloatingToolbar.jsx'

// Only the formatting the site knows how to draw (src/sections/RichText.jsx) is turned on.
// To offer more, enable it here, add a button below, and teach RichText.jsx to draw it.
const starterKit = StarterKit.configure({
  heading: { levels: [1, 2, 3] },
  blockquote: false,
  code: false,
  codeBlock: false,
  horizontalRule: false,
  link: false,
  strike: false,
  underline: false,
  // Would add an empty paragraph after a list or heading at the end of the text, which
  // would then show as a blank line on the page.
  trailingNode: false,
})

// The formatted-text editor used while editing a page. Loaded on demand by
// src/sections/RichText.jsx, which also documents the props.
export default function RichTextEditor({ value, onChange, placeholder }) {
  // The editor is set up once, so it reaches the latest onChange through a ref.
  const onChangeRef = useRef(onChange)
  useEffect(() => {
    onChangeRef.current = onChange
  })
  const [focused, setFocused] = useState(false)

  const editor = useEditor({
    extensions: [starterKit, Placeholder.configure({ placeholder })],
    // The starting text. After that the editor owns the text and reports every change.
    content: value,
    onUpdate: ({ editor }) => onChangeRef.current(editor.getJSON()),
    onFocus: () => setFocused(true),
    onBlur: () => setFocused(false),
  })

  return (
    <>
      {/* The formatting buttons float just above the text that has the cursor. */}
      {focused && <FormatToolbar editor={editor} />}
      <EditorContent editor={editor} />
    </>
  )
}

function FormatToolbar({ editor }) {
  // Which buttons are "on" for wherever the cursor is; re-read on every change.
  const active = useEditorState({
    editor,
    selector: ({ editor }) => ({
      paragraph: editor.isActive('paragraph') && !editor.isActive('bulletList') && !editor.isActive('orderedList'),
      h1: editor.isActive('heading', { level: 1 }),
      h2: editor.isActive('heading', { level: 2 }),
      h3: editor.isActive('heading', { level: 3 }),
      bold: editor.isActive('bold'),
      italic: editor.isActive('italic'),
      bulletList: editor.isActive('bulletList'),
      orderedList: editor.isActive('orderedList'),
    }),
  })

  // Each command starts from chain().focus() so the cursor stays in the text.
  const run = (command) => () => command(editor.chain().focus()).run()

  return (
    <FloatingToolbar label="Text formatting">
      <ToolbarButton label="Normal text" active={active.paragraph} onClick={run((chain) => chain.setParagraph())}>
        Text
      </ToolbarButton>
      <ToolbarButton label="Heading 1" active={active.h1} onClick={run((chain) => chain.toggleHeading({ level: 1 }))}>
        H1
      </ToolbarButton>
      <ToolbarButton label="Heading 2" active={active.h2} onClick={run((chain) => chain.toggleHeading({ level: 2 }))}>
        H2
      </ToolbarButton>
      <ToolbarButton label="Heading 3" active={active.h3} onClick={run((chain) => chain.toggleHeading({ level: 3 }))}>
        H3
      </ToolbarButton>
      <Separator orientation="vertical" h="4" />
      <ToolbarButton label="Bold" active={active.bold} onClick={run((chain) => chain.toggleBold())}>
        {/* f032 = bold */}
        <FaIcon code="f032" />
      </ToolbarButton>
      <ToolbarButton label="Italic" active={active.italic} onClick={run((chain) => chain.toggleItalic())}>
        {/* f033 = italic */}
        <FaIcon code="f033" />
      </ToolbarButton>
      <Separator orientation="vertical" h="4" />
      <ToolbarButton label="Bulleted list" active={active.bulletList} onClick={run((chain) => chain.toggleBulletList())}>
        {/* f0ca = bulleted list */}
        <FaIcon code="f0ca" />
      </ToolbarButton>
      <ToolbarButton
        label="Numbered list"
        active={active.orderedList}
        onClick={run((chain) => chain.toggleOrderedList())}
      >
        {/* f0cb = numbered list */}
        <FaIcon code="f0cb" />
      </ToolbarButton>
    </FloatingToolbar>
  )
}
