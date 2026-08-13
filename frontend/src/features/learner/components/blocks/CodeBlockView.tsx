import type { BlockSchema } from "@/client"
import { BlockType } from "@/client"

export function CodeBlockView({ block }: { block: BlockSchema }) {
  const payload = block.payload ?? {}
  const code = typeof payload.code === "string" ? payload.code : ""
  const language = typeof payload.language === "string" ? payload.language : ""

  return (
    <div className="overflow-hidden rounded-xl bg-[color-mix(in_oklch,var(--secondary),var(--background)_40%)]">
      {language && (
        <div className="flex items-center justify-between bg-secondary/60 px-3 py-1.5">
          <span className="text-xs font-medium text-muted-foreground">{language}</span>
          {block.block_type === BlockType.CODE && (
            <CodeCopy code={code} />
          )}
        </div>
      )}
      <pre className="max-h-96 overflow-auto p-4 font-mono text-sm leading-relaxed text-foreground">
        <code>{code || "// пусто"}</code>
      </pre>
    </div>
  )
}

function CodeCopy({ code }: { code: string }) {
  const handleClick = () => {
    navigator.clipboard?.writeText(code).catch(() => undefined)
  }
  return (
    <button
      type="button"
      onClick={handleClick}
      className="text-xs text-muted-foreground hover:text-foreground transition-colors"
    >
      Скопировать
    </button>
  )
}