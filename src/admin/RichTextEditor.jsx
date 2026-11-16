import { useEffect, useRef, useState } from 'react'
import { Box, Button, HStack, Separator } from '@chakra-ui/react'
import { Placeholder } from '@tiptap/extensions'
import { EditorContent, useEditor, useEditorState } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import FaIcon from './FaIcon.jsx'
import { EMBED_CLASS } from './embeddedSystem.js'

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

// How far from the top of the screen the buttons stop when following a long text: clear of
// the editor bar (2.5rem, see EditorBar.jsx) plus the buttons' own height and a little air.
const STICKY_TOP = '5.75rem'

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
      {/* The formatting buttons float just above the text, and only for the text that
          currently has the cursor. This wrapper has no height, so it takes up no room in
          the page; the buttons hang upwards from it. Being "sticky", it also follows the
          top of the screen when the text is longer than the window, so the buttons stay
          in reach. */}
      {focused && (
        <Box className={EMBED_CLASS} position="sticky" top={STICKY_TOP} h="0" zIndex="10">
          <Box position="absolute" bottom="2" left="0" p="1" bg="bg" borderWidth="1px" borderRadius="md" shadow="md">
            <FormatToolbar editor={editor} />
          </Box>
        </Box>
      )}
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
    <HStack gap="1" role="toolbar" aria-label="Text formatting">
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
    </HStack>
  )
}

function ToolbarButton({ label, active, onClick, children }) {
  return (
    <Button
      size="xs"
      minW="7"
      px="2"
      variant={active ? 'solid' : 'ghost'}
      aria-label={label}
      aria-pressed={active}
      title={label}
      // Keep the cursor (and so the selection, and this toolbar) in the text when a button
      // is pressed with the mouse.
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
    >
      {children}
    </Button>
  )
}
