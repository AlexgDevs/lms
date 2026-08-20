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
  const testCases = Array.isArray(payload.test_cases)
    ? (payload.test_cases as Array<{ input?: unknown; output?: unknown }>)
    : []

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

      {testCases.length > 0 && (
        <div className="border-t border-secondary/60 px-4 py-3 space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Тесты
          </p>
          {testCases.map((testCase, index) => (
            <div key={index} className="grid grid-cols-[auto_1fr_1fr] gap-2 items-start">
              <span className="mt-1 rounded bg-secondary/60 px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                Тест {index + 1}
              </span>
              <TestCaseCell label="Вход" value={testCase.input} />
              <TestCaseCell label="Ожидаемый вывод" value={testCase.output} />
            </div>
          ))}
        </div>
      )}

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

function TestCaseCell({ label, value }: { label: string; value: unknown }) {
  const text = value === undefined || value === null ? "" : String(value)
  return (
    <div className="min-w-0 rounded-lg bg-background/60 px-2.5 py-1.5">
      <p className="text-[10px] font-medium text-muted-foreground uppercase">{label}</p>
      <pre className="mt-0.5 whitespace-pre-wrap break-words font-mono text-xs leading-relaxed text-foreground">
        {text || "—"}
      </pre>
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