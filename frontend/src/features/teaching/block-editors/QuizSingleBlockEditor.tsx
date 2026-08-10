import { CheckCircle2 } from "lucide-react"

import { QuizOptionsEditor } from "./QuizOptionsEditor"
import type { QuizSingleBlockPayload } from "@/features/teaching/schemas/block"

interface QuizSingleBlockEditorProps {
  payload: QuizSingleBlockPayload
  onChange: (payload: QuizSingleBlockPayload) => void
}

export function QuizSingleBlockEditor({ payload, onChange }: QuizSingleBlockEditorProps) {
  const options = payload.options || []
  const correctOptionId = payload.correct_option_id

  const handleAddOption = () => {
    const nextId = options.length > 0 ? Math.max(...options.map((o) => o.id)) + 1 : 1
    const newOptions = [...options, { id: nextId, text: `Вариант ${nextId}` }]

    onChange({
      ...payload,
      options: newOptions,
      correct_option_id: correctOptionId ?? nextId,
    })
  }

  const handleDeleteOption = (id: number) => {
    const newOptions = options.filter((o) => o.id !== id)

    let newCorrectId = correctOptionId
    if (correctOptionId === id) {
      newCorrectId = newOptions[0]?.id ?? 0
    }

    onChange({
      ...payload,
      options: newOptions,
      correct_option_id: newCorrectId,
    })
  }

  const handleTextChange = (id: number, text: string) => {
    const newOptions = options.map((o) => (o.id === id ? { ...o, text } : o))
    onChange({
      ...payload,
      options: newOptions,
    })
  }

  const handleSelectCorrect = (id: number) => {
    onChange({
      ...payload,
      correct_option_id: id,
    })
  }

  return (
    <QuizOptionsEditor
      title="Варианты ответа (отметьте правильный):"
      options={options}
      onAdd={handleAddOption}
      onChangeText={handleTextChange}
      onRemove={handleDeleteOption}
      renderCorrectToggle={(option) => {
        const isCorrect = correctOptionId === option.id
        return (
          <button
            type="button"
            onClick={() => handleSelectCorrect(option.id)}
            className={`flex items-center justify-center h-7 w-7 rounded-lg border transition-colors shrink-0 ${
              isCorrect
                ? "bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400"
                : "border-input bg-background text-muted-foreground hover:border-muted-foreground/60"
            }`}
            title={isCorrect ? "Правильный ответ" : "Сделать правильным"}
          >
            <CheckCircle2 size={14} />
          </button>
        )
      }}
    />
  )
}
