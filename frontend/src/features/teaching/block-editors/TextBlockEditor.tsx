import { useEffect, useRef, useState, type ReactNode } from "react"

import {
  EditorContent,
  useEditor,
  useEditorState,
  type Editor,
} from "@tiptap/react"
import { BubbleMenu } from "@tiptap/react/menus"
import StarterKit from "@tiptap/starter-kit"
import TiptapLink from "@tiptap/extension-link"
import TiptapUnderline from "@tiptap/extension-underline"
import {
  Bold,
  Code,
  Heading2,
  Heading3,
  Italic,
  Link,
  List,
  ListOrdered,
  Quote,
  Strikethrough,
  Underline,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { TextBlockPayload } from "@/features/teaching/schemas/block"

interface TextBlockEditorProps {
  payload: TextBlockPayload
  onChange: (payload: TextBlockPayload) => void
}

/** Converts legacy plain text payloads to HTML so the editor always deals with HTML. */
function plainTextToHtml(text: string): string {
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
  return escaped
    .split(/\n{2,}/)
    .map((block) => `<p>${block.replace(/\n/g, "<br>")}</p>`)
    .join("")
}

export function TextBlockEditor({ payload, onChange }: TextBlockEditorProps) {
  const [initialContent] = useState(() => payload.html ?? plainTextToHtml(payload.text ?? ""))
  const lastEmittedRef = useRef<string>(initialContent)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        // disable built-in link/underline to use dedicated extensions
        link: false,
        underline: false,
      }),
      TiptapUnderline,
      TiptapLink.configure({
        openOnClick: false,
        autolink: true,
        defaultProtocol: "https",
      }),
    ],
    content: initialContent,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      lastEmittedRef.current = html
      onChange({ text: editor.getText(), html })
    },
    editorProps: {
      attributes: {
        class: "rich-text-editor focus:outline-none",
      },
    },
  })

  useEffect(() => {
    if (!editor) return
    const next = payload.html ?? plainTextToHtml(payload.text ?? "")
    // avoid overwriting while user is typing — prevents cursor jump to end
    if (next !== lastEmittedRef.current && !editor.isFocused) {
      lastEmittedRef.current = next
      editor.commands.setContent(next, { emitUpdate: false })
    }
  }, [editor, payload.html, payload.text])

  return (
    <div className="relative">
      {editor && (
        <BubbleMenu
          editor={editor}
          shouldShow={({ editor: e, state }) =>
            e.isEditable && !state.selection.empty
          }
          options={{ placement: "top", offset: 8 }}
          className="z-50 flex items-center gap-0.5 rounded-full border border-black/10 bg-foreground px-1.5 py-1 shadow-lg"
        >
          <Toolbar editor={editor} />
        </BubbleMenu>
      )}
      <EditorContent editor={editor} />
    </div>
  )
}

function Toolbar({ editor }: { editor: Editor }) {
  const state = useEditorState({
    editor,
    selector: ({ editor }) => ({
      bold: editor.isActive("bold"),
      italic: editor.isActive("italic"),
      underline: editor.isActive("underline"),
      strike: editor.isActive("strike"),
      quote: editor.isActive("blockquote"),
      h2: editor.isActive("heading", { level: 2 }),
      h3: editor.isActive("heading", { level: 3 }),
      bulletList: editor.isActive("bulletList"),
      orderedList: editor.isActive("orderedList"),
      inlineCode: editor.isActive("code"),
      link: editor.isActive("link"),
    }),
  })

  const toggleLink = () => {
    if (editor.isActive("link")) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run()
      return
    }
    const value = window.prompt("Введите URL ссылки")
    if (!value) return
    const href = /^https?:\/\//i.test(value) ? value : `https://${value}`
    editor.chain().focus().extendMarkRange("link").setLink({ href }).run()
  }

  return (
    <>
      <ToolbarButton label="Жирный (Ctrl+B)" active={state.bold} onClick={() => editor.chain().focus().toggleBold().run()}>
        <Bold />
      </ToolbarButton>
      <ToolbarButton label="Курсив (Ctrl+I)" active={state.italic} onClick={() => editor.chain().focus().toggleItalic().run()}>
        <Italic />
      </ToolbarButton>
      <ToolbarButton label="Подчёркнутый (Ctrl+U)" active={state.underline} onClick={() => editor.chain().focus().toggleUnderline().run()}>
        <Underline />
      </ToolbarButton>
      <ToolbarButton label="Зачёркнутый" active={state.strike} onClick={() => editor.chain().focus().toggleStrike().run()}>
        <Strikethrough />
      </ToolbarButton>
      <ToolbarButton label="Инлайн-код" active={state.inlineCode} onClick={() => editor.chain().focus().toggleCode().run()}>
        <Code />
      </ToolbarButton>

      <ToolbarDivider />

      <ToolbarButton label="Заголовок 2" active={state.h2} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
        <Heading2 />
      </ToolbarButton>
      <ToolbarButton label="Заголовок 3" active={state.h3} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
        <Heading3 />
      </ToolbarButton>
      <ToolbarButton label="Цитата" active={state.quote} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
        <Quote />
      </ToolbarButton>
      <ToolbarButton label="Маркированный список" active={state.bulletList} onClick={() => editor.chain().focus().toggleBulletList().run()}>
        <List />
      </ToolbarButton>
      <ToolbarButton label="Нумерованный список" active={state.orderedList} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
        <ListOrdered />
      </ToolbarButton>
      <ToolbarButton label="Ссылка" active={state.link} onClick={toggleLink}>
        <Link />
      </ToolbarButton>
    </>
  )
}

function ToolbarButton({
  label,
  active,
  onClick,
  children,
}: {
  label: string
  active?: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      title={label}
      aria-label={label}
      aria-pressed={active}
      onClick={(e) => {
        // не даём кнопке украсть фокус у редактора
        e.preventDefault()
        onClick()
      }}
      onMouseDown={(e) => e.preventDefault()}
      className={cn(
        "rounded-full",
        active
          ? "bg-background/25 text-background hover:bg-background/30 hover:text-background"
          : "text-background/60 hover:bg-background/10 hover:text-background",
      )}
    >
      {children}
    </Button>
  )
}

function ToolbarDivider() {
  return <span className="mx-0.5 h-4 w-px shrink-0 bg-background/20" />
}
