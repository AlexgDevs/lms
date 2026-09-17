import { Loader2, MessageSquare } from "lucide-react"
import { Card } from "@/components/ui/card"
import { useReviewRating, useReviews, useCreateReview } from "@/features/review/api/useReviews"
import { ReviewForm } from "./ReviewForm"
import { ReviewItem } from "./ReviewItem"
import { StarRating } from "./StarRating"
import type { ReviewTargetType } from "@/client"
import { cn } from "@/lib/utils"

interface ReviewSectionProps {
  targetType: ReviewTargetType
  targetId: string
  title?: string
  showRating?: boolean
  canWrite?: boolean
}

export function ReviewSection({
  targetType,
  targetId,
  title = "Отзывы",
  showRating = false,
  canWrite = false,
}: ReviewSectionProps) {
  const reviews = useReviews({ targetType, targetId })
  const rating = useReviewRating({ targetType, targetId, enabled: showRating })
  const createReview = useCreateReview()

  const isLoading = reviews.isLoading
  const items = reviews.data ?? []

  const avg = rating.data?.average ?? 0
  const count = rating.data?.count ?? 0
  const distribution = rating.data?.distribution ?? {}

  const totalRatingValues = Object.values(distribution).reduce((a, b) => a + b, 0)

  return (
    <Card className="rounded-xl p-4 sm:p-5 shadow-[var(--shadow-card)]">
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare className="h-4 w-4 text-primary" />
        <h2 className="font-bold text-sm sm:text-base text-foreground">{title}</h2>
      </div>

      {showRating && (
        <div className="mb-4 flex flex-col gap-3 rounded-lg bg-muted/30 p-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <span className="text-3xl font-bold tabular-nums text-foreground">
              {avg || "—"}
            </span>
            <div className="space-y-0.5">
              <StarRating value={avg} readonly size={16} />
              <p className="text-xs text-muted-foreground">{count} оценок</p>
            </div>
          </div>
          {totalRatingValues > 0 && (
            <div className="flex-1 space-y-1">
              {[5, 4, 3, 2, 1].map((star) => {
                const value = distribution[String(star)] ?? 0
                const percent =
                  totalRatingValues > 0 ? Math.round((value / totalRatingValues) * 100) : 0
                return (
                  <div key={star} className="flex items-center gap-2 text-[11px]">
                    <span className="w-2 text-muted-foreground tabular-nums">{star}</span>
                    <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-reward transition-all"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <span className="w-5 text-right text-muted-foreground tabular-nums">
                      {value}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {canWrite && (
        <div className="mb-5">
          <ReviewForm
            targetType={targetType}
            targetId={targetId}
            showRating={showRating}
            onSubmit={(data) => createReview.mutate({ body: data })}
            isSubmitting={createReview.isPending}
          />
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : items.length === 0 ? (
        <div className="py-10 text-center">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <MessageSquare className="h-5 w-5" />
          </div>
          <p className="mt-3 text-sm font-medium text-foreground">
            {showRating ? "Отзывов пока нет" : "Комментариев пока нет"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {showRating ? "Будьте первым — поделитесь мнением о курсе" : "Начните обсуждение — задайте вопрос или поделитесь мыслью"}
          </p>
        </div>
      ) : (
        <div className={cn("space-y-4 sm:space-y-5")}>
          {items.map((review) => (
            <ReviewItem
              key={review.id}
              review={review}
              canReply={canWrite}
              onReplySubmit={(parentId, text) =>
                createReview.mutate({
                  body: { target_type: targetType, target_id: targetId, text, parent_id: parentId },
                })
              }
              isSubmittingReply={createReview.isPending}
            />
          ))}
        </div>
      )}
    </Card>
  )
}
