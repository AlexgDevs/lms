import { useState } from "react"
import { MessageSquare } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { StarRating } from "./StarRating"
import { ReplyForm } from "./ReplyForm"
import type { ReviewSchema } from "@/client"
import { cn } from "@/lib/utils"

interface ReviewItemProps {
  review: ReviewSchema
  canReply?: boolean
  isReply?: boolean
  onReplySubmit?: (parentId: string, text: string) => void
  isSubmittingReply?: boolean
}

export function ReviewItem({
  review,
  canReply = false,
  isReply = false,
  onReplySubmit,
  isSubmittingReply = false,
}: ReviewItemProps) {
  const [replyOpen, setReplyOpen] = useState(false)
  const username = review.user_username || "Студент"
  const initial = username.charAt(0).toUpperCase()
  const hasRating = typeof review.rating === "number"

  return (
    <div className={cn(!isReply && "rounded-xl bg-muted/40 p-3")}>
      <div className="flex gap-2.5">
        <Avatar className={cn("shrink-0", isReply ? "h-6 w-6 mt-0.5" : "h-8 w-8")}>
          <AvatarFallback className={cn(isReply && "text-[10px]")}>
            {initial}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={cn(
                "font-semibold text-foreground truncate",
                isReply ? "text-xs" : "text-sm"
              )}
            >
              {username}
            </span>

            {hasRating && <StarRating value={review.rating as number} readonly size={14} />}

            <span className="text-[11px] text-muted-foreground">
              {new Date(review.created_at).toLocaleDateString("ru-RU")}
              {review.is_edited && (
                <span className="ml-1 text-muted-foreground/60">(изм.)</span>
              )}
            </span>
          </div>

          <p
            className={cn(
              "text-foreground/90 leading-relaxed whitespace-pre-wrap break-words",
              isReply ? "mt-0.5 text-sm" : "mt-1.5 text-sm"
            )}
          >
            {review.text}
          </p>

          {!isReply && canReply && onReplySubmit && (
            <div className="mt-1.5">
              {replyOpen ? (
                <ReplyForm
                  onSubmit={(text) => onReplySubmit(review.id, text)}
                  isSubmitting={isSubmittingReply}
                  onCancel={() => setReplyOpen(false)}
                />
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 -ml-2 text-xs gap-1 text-muted-foreground"
                  onClick={() => setReplyOpen(true)}
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  Ответить
                </Button>
              )}
            </div>
          )}

          {/* Ветка ответов: вложена под текстом родителя, с вертикальной линией слева */}
          {review.replies && review.replies.length > 0 && (
            <div className="mt-2 space-y-2 border-l-2 border-border/60 pl-2.5">
              {review.replies.map((reply) => (
                <ReviewItem key={reply.id} review={reply} isReply />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
