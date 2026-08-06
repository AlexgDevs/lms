import { Plus, X, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface QuizOption {
  id: number
  text: string
}

interface QuizSinglePayload {
  options: QuizOption[]
  correct_option_id: number | null
}

interface QuizSingleBlockEditorProps {
  payload: QuizSinglePayload
  onChange: (payload: QuizSinglePayload) => void
}

export function QuizSingleBlockEditor({ payload, onChange }: QuizSingleBlockEditorProps) {
  const options = payload.options || []
  const correctOptionId = payload.correct_option_id

  // Добавление нового варианта ответа
  const handleAddOption = () => {
    const nextId = options.length > 0 ? Math.max(...options.map((o) => o.id)) + 1 : 1
    const newOptions = [...options, { id: nextId, text: `Вариант ${nextId}` }]
    
    onChange({
      ...payload,
      options: newOptions,
      // Если это первый вариант, автоматически делаем его правильным
      correct_option_id: correctOptionId === null ? nextId : correctOptionId,
    })
  }

  // Удаление варианта ответа
  const handleDeleteOption = (id: number) => {
    const newOptions = options.filter((o) => o.id !== id)
    
    let newCorrectId = correctOptionId
    if (correctOptionId === id) {
      newCorrectId = newOptions.length > 0 ? newOptions[0].id : null
    }

    onChange({
      ...payload,
      options: newOptions,
      correct_option_id: newCorrectId,
    })
  }

  // Изменение текста конкретного варианта
  const handleTextChange = (id: number, text: string) => {
    const newOptions = options.map((o) => (o.id === id ? { ...o, text } : o))
    onChange({
      ...payload,
      options: newOptions,
    })
  }

  // Выбор правильного ответа
  const handleSelectCorrect = (id: number) => {
    onChange({
      ...payload,
      correct_option_id: id,
    })
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-[11px] font-medium text-muted-foreground">
          Варианты ответа (отметьте правильный):
        </label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-6 text-[10px] gap-1"
          onClick={handleAddOption}
        >
          <Plus size={11} /> Добавить вариант
        </Button>
      </div>

      <div className="space-y-2">
        {options.map((option, index) => {
          const isCorrect = correctOptionId === option.id

          return (
            <div key={option.id} className="flex items-center gap-2">
              {/* Кнопка выбора правильного ответа */}
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

              {/* Порядковый номер / префикс */}
              <span className="text-[11px] font-mono text-muted-foreground w-4">
                {index + 1}.
              </span>

              {/* Поле ввода текста варианта */}
              <Input
                value={option.text}
                onChange={(e) => handleTextChange(option.id, e.target.value)}
                placeholder={`Текст варианта ${index + 1}...`}
                className="h-7 text-xs flex-1"
              />

              {/* Удалить вариант */}
              {options.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
                  onClick={() => handleDeleteOption(option.id)}
                >
                  <X size={13} />
                </Button>
              )}
            </div>
          )
        })}

        {options.length === 0 && (
          <div className="text-center py-4 border border-dashed border-border rounded-lg text-xs text-muted-foreground">
            Нет добавленных вариантов. Нажмите «Добавить вариант».
          </div>
        )}
      </div>
    </div>
  )
}