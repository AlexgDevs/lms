import { Plus, X, CheckSquare, Square } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface QuizOption {
  id: number
  text: string
}

interface QuizMultiplePayload {
  options: QuizOption[]
  correct_option_ids: number[]
}

interface QuizMultipleBlockEditorProps {
  payload: QuizMultiplePayload
  onChange: (payload: QuizMultiplePayload) => void
}

export function QuizMultipleBlockEditor({ payload, onChange }: QuizMultipleBlockEditorProps) {
  const options = payload.options || []
  const correctOptionIds = payload.correct_option_ids || []

  // Добавление нового варианта ответа
  const handleAddOption = () => {
    const nextId = options.length > 0 ? Math.max(...options.map((o) => o.id)) + 1 : 1
    const newOptions = [...options, { id: nextId, text: `Вариант ${nextId}` }]
    
    onChange({
      ...payload,
      options: newOptions,
    })
  }

  // Удаление варианта ответа
  const handleDeleteOption = (id: number) => {
    const newOptions = options.filter((o) => o.id !== id)
    // Убираем ID из списка правильных, если он там был
    const newCorrectIds = correctOptionIds.filter((correctId) => correctId !== id)

    onChange({
      ...payload,
      options: newOptions,
      correct_option_ids: newCorrectIds,
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

  // Переключение состояния «правильный/неправильный» для конкретного варианта
  const handleToggleCorrect = (id: number) => {
    let newCorrectIds: number[]
    if (correctOptionIds.includes(id)) {
      // Исключаем из правильных
      newCorrectIds = correctOptionIds.filter((correctId) => correctId !== id)
    } else {
      // Добавляем в правильные
      newCorrectIds = [...correctOptionIds, id]
    }

    onChange({
      ...payload,
      correct_option_ids: newCorrectIds,
    })
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-[11px] font-medium text-muted-foreground">
          Варианты ответа (можно выбрать несколько правильных):
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
          const isCorrect = correctOptionIds.includes(option.id)

          return (
            <div key={option.id} className="flex items-center gap-2">
              {/* Кнопка переключения множественного выбора */}
              <button
                type="button"
                onClick={() => handleToggleCorrect(option.id)}
                className={`flex items-center justify-center h-7 w-7 rounded-lg border transition-colors shrink-0 ${
                  isCorrect
                    ? "bg-purple-500/10 border-purple-500 text-purple-600 dark:text-purple-400"
                    : "border-input bg-background text-muted-foreground hover:border-muted-foreground/60"
                }`}
                title={isCorrect ? "Правильный ответ (включен)" : "Сделать правильным"}
              >
                {isCorrect ? <CheckSquare size={14} /> : <Square size={14} />}
              </button>

              {/* Порядковый номер */}
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