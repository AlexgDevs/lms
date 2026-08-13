import { CheckCircle2, XCircle } from "lucide-react"
import type { BlockSchema } from "@/client"
import type { BlockSubmissionType } from "@/client"
import { cn } from "@/lib/utils"

interface QuizOptionType {
  id: number
  text: string
}

interface QuizBlockViewProps {
  block: BlockSchema
  selected: number[]
  onSelect: (blockId: string, selected: number[]) => void
  result?: BlockSubmissionType
  locked: boolean
}

export function QuizBlockView({ block, selected, onSelect, result, locked }: QuizBlockViewProps) {
  const payload = block.payload ?? {}
  const options = Array.isArray(payload.options)
    ? (payload.options as QuizOptionType[])
    : []
  const multiple = block.block_type === "quiz_multiple_choice"

  const isCorrect = result === "correct" || result === "completed"
  const isWrong = result === "wrong"
  const frozen = locked || isCorrect

  const handleToggle = (optionId: number) => {
    if (frozen) return
    if (!multiple) {
      onSelect(block.id, [optionId])
      return
    }
    onSelect(
      block.id,
      selected.includes(optionId)
        ? selected.filter((id) => id !== optionId)
        : [...selected, optionId],
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
        <span className={cn("rounded-full px-2.5 py-0.5", "bg-secondary/40")}>
          {multiple ? "Выберите несколько вариантов" : "Выберите один вариант"}
        </span>
      </div>

      <ul className="space-y-2">
        {options.map((option) => {
          const isSelected = selected.includes(option.id)
          return (
            <li key={option.id}>
              <button
                type="button"
                disabled={frozen}
                onClick={() => handleToggle(option.id)}
                className={cn(
                  "w-full text-left rounded-xl border px-3.5 py-2.5 text-sm transition-colors cursor-pointer disabled:cursor-default",
                  isCorrect && isSelected
                    ? "border-success/60 bg-success/10 text-foreground"
                    : isWrong && isSelected
                      ? "border-destructive/60 bg-destructive/10 text-foreground"
                      : isSelected
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-border/60 bg-background/40 text-foreground/90 hover:border-border hover:bg-muted/50",
                )}
              >
                <span className="flex items-center gap-2.5">
                  <span
                    className={cn(
                      "flex h-4 w-4 shrink-0 items-center justify-center border rounded-[3px] text-[10px]",
                      multiple ? "rounded-[3px]" : "rounded-full",
                      isSelected ? "border-primary bg-primary text-primary-foreground" : "border-border",
                    )}
                  >
                    {isSelected && multiple ? "✓" : isSelected && !multiple ? "●" : ""}
                  </span>
                  <span>{option.text}</span>
                </span>
              </button>
            </li>
          )
        })}
      </ul>

      {isCorrect && (
        <p className="flex items-center gap-1.5 text-sm font-medium text-success">
          <CheckCircle2 className="h-4 w-4" />
          Верно!
        </p>
      )}
      {isWrong && (
        <p className="flex items-center gap-1.5 text-sm font-medium text-destructive">
          <XCircle className="h-4 w-4" />
          Неверно. Попробуйте ещё раз.
        </p>
      )}
    </div>
  )
}