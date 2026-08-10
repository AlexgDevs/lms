import type { ReactNode } from "react"

import { Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { QuizOption } from "@/features/teaching/schemas/block"

interface QuizOptionsEditorProps {
  title: string
  options: QuizOption[]
  renderCorrectToggle: (option: QuizOption, index: number) => ReactNode
  onAdd: () => void
  onChangeText: (id: number, text: string) => void
  onRemove: (id: number) => void
}

export function QuizOptionsEditor({
  title,
  options,
  renderCorrectToggle,
  onAdd,
  onChangeText,
  onRemove,
}: QuizOptionsEditorProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-[11px] font-medium text-muted-foreground">{title}</label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-6 text-[10px] gap-1"
          onClick={onAdd}
        >
          <Plus size={11} /> Добавить вариант
        </Button>
      </div>

      <div className="space-y-2">
        {options.map((option, index) => (
          <div key={option.id} className="flex items-center gap-2">
            {renderCorrectToggle(option, index)}

            <span className="text-[11px] font-mono text-muted-foreground w-4">
              {index + 1}.
            </span>

            <Input
              value={option.text}
              onChange={(e) => onChangeText(option.id, e.target.value)}
              placeholder={`Текст варианта ${index + 1}...`}
              className="h-7 text-xs flex-1"
            />

            {options.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
                onClick={() => onRemove(option.id)}
              >
                <X size={13} />
              </Button>
            )}
          </div>
        ))}

        {options.length === 0 && (
          <div className="text-center py-4 border border-dashed border-border rounded-lg text-xs text-muted-foreground">
            Нет добавленных вариантов. Нажмите «Добавить вариант».
          </div>
        )}
      </div>
    </div>
  )
}
