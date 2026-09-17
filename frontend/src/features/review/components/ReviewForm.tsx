import { useState } from "react"
import { Loader2, Send } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { StarRating } from "./StarRating"
import type { ReviewTargetType } from "@/client"
import useAuth from "@/features/auth/api/useAuth"
import { resolveMediaUrl } from "@/lib/media"

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
  const { user } = useAuth()
  const avatarSrc = resolveMediaUrl(user?.avatar_url ?? undefined)
  const initial = (user?.username?.[0] ?? "Я").toUpperCase()

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
    <div className="flex gap-3">
      <Avatar className="h-9 w-9 shrink-0 border border-border/60 hidden sm:flex">
        {avatarSrc ? <AvatarImage src={avatarSrc} alt={user?.username ?? "Я"} /> : null}
        <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">{initial}</AvatarFallback>
      </Avatar>
      <div className="flex-1 space-y-2 min-w-0">
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
          className="min-h-[80px] bg-background"
        />
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] text-muted-foreground tabular-nums">{text.length}/2000</span>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={!canSubmit || isSubmitting}
            className="h-8 gap-1.5"
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
    </div>
  )
}
