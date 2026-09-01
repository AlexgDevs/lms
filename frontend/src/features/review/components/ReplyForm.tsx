import { useState } from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

interface ReplyFormProps {
  onSubmit: (text: string) => void
  isSubmitting?: boolean
  onCancel?: () => void
}

export function ReplyForm({ onSubmit, isSubmitting = false, onCancel }: ReplyFormProps) {
  const [text, setText] = useState("")
  const canSubmit = text.trim().length > 0

  const handleSubmit = () => {
    if (!canSubmit) return
    onSubmit(text.trim())
    setText("")
  }

  return (
    <div className="space-y-2">
      <Textarea
        placeholder="Ответить..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        maxLength={2000}
        className="min-h-[64px]"
      />
      <div className="flex items-center justify-end gap-2">
        {onCancel && (
          <Button size="sm" variant="ghost" onClick={onCancel}>
            Отмена
          </Button>
        )}
        <Button
          size="sm"
          onClick={handleSubmit}
          disabled={!canSubmit || isSubmitting}
        >
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          Ответить
        </Button>
      </div>
    </div>
  )
}
