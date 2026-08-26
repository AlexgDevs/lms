import { useState } from "react"
import { Loader2, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { StarRating } from "./StarRating"
import type { ReviewTargetType } from "@/client"

interface ReviewFormProps {
  targetType: ReviewTargetType
  targetId: string
  showRating?: boolean
  onSubmit: (data: {
    target_type: ReviewTargetType
    target_id: string
    rating?: number
    text: string
  }) => void
  isSubmitting?: boolean
}

export function ReviewForm({
  targetType,
  targetId,
  showRating = false,
  onSubmit,
  isSubmitting = false,
}: ReviewFormProps) {
  const [text, setText] = useState("")
  const [rating, setRating] = useState(0)

  const canSubmit = text.trim().length > 0 && (!showRating || rating > 0)

  const handleSubmit = () => {
    if (!canSubmit) return
    onSubmit({
      target_type: targetType,
      target_id: targetId,
      ...(showRating ? { rating } : {}),
      text: text.trim(),
    })
    setText("")
    if (showRating) setRating(0)
  }

  return (
    <div className="space-y-2">
      {showRating && (
        <StarRating value={rating} onChange={setRating} size={22} />
      )}
      <Textarea
        placeholder={
          showRating
            ? "Поделитесь впечатлениями о курсе..."
            : "Напишите комментарий..."
        }
        value={text}
        onChange={(e) => setText(e.target.value)}
        maxLength={2000}
      />
      <div className="flex justify-end">
        <Button
          size="sm"
          onClick={handleSubmit}
          disabled={!canSubmit || isSubmitting}
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          Отправить
        </Button>
      </div>
    </div>
  )
}
