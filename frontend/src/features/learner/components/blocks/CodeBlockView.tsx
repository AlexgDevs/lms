import { CheckCircle2, XCircle } from "lucide-react"
import type { BlockSchema } from "@/client"
import type { BlockSubmissionType } from "@/client"

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

  const lines = value ? value.split("\n") : [""]

  return (
    <div className="overflow-hidden rounded-xl bg-secondary/40">
      <div className="flex items-center justify-between bg-secondary/60 px-3.5 py-1.5">
        <span className="inline-flex items-center rounded bg-secondary/70 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          {language || "Code"}
        </span>
        <CodeCopy code={value} disabled={frozen} />
      </div>

      <div className="code-font text-[13px] leading-relaxed text-foreground">
        {frozen ? (
          <div className="max-h-96 overflow-auto px-1 py-2">
            <div className="min-w-max">
              {lines.map((line, index) => (
                <div key={index} className="flex px-1">
                  <span className="w-8 shrink-0 select-none pr-3 text-right text-[11px] leading-relaxed text-muted-foreground/50">
                    {index + 1}
                  </span>
                  <pre className="whitespace-pre">{line || " "}</pre>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <textarea
            value={value}
            onChange={(e) => onChange(block.id, e.target.value)}
            readOnly={frozen}
            spellCheck={false}
            wrap="off"
            placeholder="Введите ваш код..."
            className="w-full max-h-96 min-h-[132px] resize-y overflow-auto bg-transparent p-3.5 outline-none whitespace-pre"
          />
        )}
      </div>

      {testCases.length > 0 && (
        <div className="px-4 pb-3 pt-2 space-y-2">
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
      <pre className="code-font mt-0.5 whitespace-pre-wrap break-words text-xs leading-relaxed text-foreground">
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
