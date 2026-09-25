import { useState } from "react"
import { Loader2, Send } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { StarRating } from "./StarRating"
import type { ReviewTargetType } from "@/client"
import useAuth from "@/features/auth/api/useAuth"
import { resolveMediaUrl } from "@/lib/media"
import { cn } from "@/lib/utils"

interface ReviewFormProps {
  targetType: ReviewTargetType
  targetId: string
  showRating?: boolean
  /** Минималистичная строка ввода без рамки (Clean Reader). */
  compact?: boolean
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
  compact = false,
  onSubmit,
  isSubmitting = false,
}: ReviewFormProps) {
  const [text, setText] = useState("")
  const [rating, setRating] = useState(0)
  const { user } = useAuth()
  const avatarSrc = resolveMediaUrl(user?.avatar_url ?? undefined)
  const initial = (user?.username?.[0] ?? "Я").toUpperCase()

  const hasText = text.trim().length > 0
  const canSubmit = hasText && (!showRating || rating > 0)

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
      <Avatar
        className={cn(
          "shrink-0 border border-border/60 hidden sm:flex",
          compact && "h-7 w-7 border-border/40",
        )}
      >
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
          rows={1}
          className={
            compact
              ? "min-h-9 resize-none border-transparent bg-transparent px-1 py-1.5 shadow-none placeholder:text-muted-foreground/70 hover:bg-muted/40 focus:bg-muted/50 field-sizing-fixed focus:field-sizing-content max-h-40 overflow-y-auto transition-colors"
              : "min-h-[80px] bg-background"
          }
        />
        <div className="flex items-center justify-between gap-2">
          <span
            className={cn(
              "text-[11px] text-muted-foreground tabular-nums",
              compact && !hasText && "opacity-0",
            )}
          >
            {text.length}/2000
          </span>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={!canSubmit || isSubmitting}
            className={cn(
              "h-8 gap-1.5 transition-opacity duration-200",
              compact && !hasText && "pointer-events-none opacity-0",
            )}
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
