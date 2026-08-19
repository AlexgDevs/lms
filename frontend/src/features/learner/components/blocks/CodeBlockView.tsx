import { CheckCircle2, XCircle } from "lucide-react"
import type { BlockSchema } from "@/client"
import { BlockType } from "@/client"
import type { BlockSubmissionType } from "@/client"
import { cn } from "@/lib/utils"

interface CodeBlockViewProps {
  block: BlockSchema
  value: string
  onChange: (blockId: string, value: string) => void
  result?: BlockSubmissionType
  locked: boolean
}

export function CodeBlockView({ block, value, onChange, result, locked }: CodeBlockViewProps) {
  const payload = block.payload ?? {}
  const language = typeof payload.language === "string" ? payload.language : ""

  const isCorrect = result === "correct" || result === "completed"
  const isWrong = result === "wrong"
  const frozen = locked || isCorrect

  return (
    <div className="overflow-hidden rounded-xl bg-[color-mix(in_oklch,var(--secondary),var(--background)_40%)]">
      {language && (
        <div className="flex items-center justify-between bg-secondary/60 px-3 py-1.5">
          <span className="text-xs font-medium text-muted-foreground">{language}</span>
          {block.block_type === BlockType.CODE && (
            <CodeCopy code={value} disabled={frozen} />
          )}
        </div>
      )}
      <textarea
        value={value}
        onChange={(e) => onChange(block.id, e.target.value)}
        readOnly={frozen}
        spellCheck={false}
        placeholder="Введите ваш код..."
        className={cn(
          "w-full max-h-96 min-h-[120px] resize-y bg-transparent p-4 font-mono text-sm leading-relaxed text-foreground outline-none",
          frozen && "cursor-default",
        )}
      />

      {isCorrect && (
        <p className="flex items-center gap-1.5 px-4 pb-3 text-sm font-medium text-success">
          <CheckCircle2 className="h-4 w-4" />
          Верно!
        </p>
      )}
      {isWrong && (
        <p className="flex items-center gap-1.5 px-4 pb-3 text-sm font-medium text-destructive">
          <XCircle className="h-4 w-4" />
          Неверно. Попробуйте ещё раз.
        </p>
      )}
    </div>
  )
}

function CodeCopy({ code, disabled }: { code: string; disabled: boolean }) {
  const handleClick = () => {
    navigator.clipboard?.writeText(code).catch(() => undefined)
  }
  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className="text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
    >
      Скопировать
    </button>
  )
}