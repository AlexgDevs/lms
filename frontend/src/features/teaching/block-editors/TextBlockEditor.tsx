import { useEffect, useRef, useState, type ReactNode } from "react"

import { EditorContent, useEditor, useEditorState, type Editor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
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
  Redo2,
  Strikethrough,
  Underline,
  Undo2,
} from "lucide-react"

import { Button } from "@/components/ui/button"
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

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        link: { openOnClick: false, autolink: true, defaultProtocol: "https" },
      }),
    ],
    content: initialContent,
    onUpdate: ({ editor }) => {
      onChange({ text: editor.getText(), html: editor.getHTML() })
    },
    editorProps: {
      attributes: {
        class: "rich-text-editor focus:outline-none",
      },
    },
  })

  const lastEmittedRef = useRef<string>(initialContent)

  useEffect(() => {
    if (!editor) return
    const next = payload.html ?? plainTextToHtml(payload.text ?? "")
    if (next !== lastEmittedRef.current) {
      lastEmittedRef.current = next
      editor.commands.setContent(next, { emitUpdate: false })
    }
  }, [editor, payload.html, payload.text])

  return (
    <div className="space-y-1">
      <label className="text-[11px] text-muted-foreground font-medium">Текст контента:</label>
      <div className="overflow-hidden rounded-md border border-input bg-background">
        <Toolbar editor={editor} />
        <EditorContent editor={editor} className="px-3 py-2" />
      </div>
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
      canUndo: editor.can().undo(),
      canRedo: editor.can().redo(),
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
    <div className="flex flex-wrap items-center gap-0.5 border-b border-input bg-muted/40 px-1.5 py-1">
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

      <ToolbarDivider />

      <ToolbarButton label="Отменить" disabled={!state.canUndo} onClick={() => editor.chain().focus().undo().run()}>
        <Undo2 />
      </ToolbarButton>
      <ToolbarButton label="Повторить" disabled={!state.canRedo} onClick={() => editor.chain().focus().redo().run()}>
        <Redo2 />
      </ToolbarButton>
    </div>
  )
}

function ToolbarButton({
  label,
  active,
  disabled,
  onClick,
  children,
}: {
  label: string
  active?: boolean
  disabled?: boolean
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
      disabled={disabled}
      onClick={onClick}
      className={active ? "bg-muted text-foreground" : "text-muted-foreground"}
    >
      {children}
    </Button>
  )
}

function ToolbarDivider() {
  return <span className="mx-1 h-4 w-px shrink-0 bg-border" />
}