import { CheckSquare, Square } from "lucide-react"

import { QuizOptionsEditor } from "./QuizOptionsEditor"
import type { QuizMultipleBlockPayload } from "@/features/teaching/schemas/block"

interface QuizMultipleBlockEditorProps {
  payload: QuizMultipleBlockPayload
  onChange: (payload: QuizMultipleBlockPayload) => void
}

export function QuizMultipleBlockEditor({
  payload,
  onChange,
}: QuizMultipleBlockEditorProps) {
  const options = payload.options || []
  const correctOptionIds = payload.correct_option_ids || []

  const handleAddOption = () => {
    const nextId = options.length > 0 ? Math.max(...options.map((o) => o.id)) + 1 : 1
    const newOptions = [...options, { id: nextId, text: `Вариант ${nextId}` }]

    onChange({
      ...payload,
      options: newOptions,
    })
  }

  const handleDeleteOption = (id: number) => {
    const newOptions = options.filter((o) => o.id !== id)
    const newCorrectIds = correctOptionIds.filter((correctId) => correctId !== id)

    onChange({
      ...payload,
      options: newOptions,
      correct_option_ids: newCorrectIds,
    })
  }

  const handleTextChange = (id: number, text: string) => {
    const newOptions = options.map((o) => (o.id === id ? { ...o, text } : o))
    onChange({
      ...payload,
      options: newOptions,
    })
  }

  const handleToggleCorrect = (id: number) => {
    const newCorrectIds = correctOptionIds.includes(id)
      ? correctOptionIds.filter((correctId) => correctId !== id)
      : [...correctOptionIds, id]

    onChange({
      ...payload,
      correct_option_ids: newCorrectIds,
    })
  }

  return (
    <QuizOptionsEditor
      title="Варианты ответа (можно выбрать несколько правильных):"
      options={options}
      onAdd={handleAddOption}
      onChangeText={handleTextChange}
      onRemove={handleDeleteOption}
      renderCorrectToggle={(option) => {
        const isCorrect = correctOptionIds.includes(option.id)
        return (
          <button
            type="button"
            onClick={() => handleToggleCorrect(option.id)}
            className={`flex items-center justify-center h-7 w-7 rounded-lg border transition-colors shrink-0 ${
              isCorrect
                ? "bg-primary/10 border-primary text-primary"
                : "border-input bg-background text-muted-foreground hover:border-muted-foreground/60"
            }`}
            title={isCorrect ? "Правильный ответ (включен)" : "Сделать правильным"}
          >
            {isCorrect ? <CheckSquare size={14} /> : <Square size={14} />}
          </button>
        )
      }}
    />
  )
}
