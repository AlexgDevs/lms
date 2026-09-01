import { Star } from "lucide-react"
import { useReviewRating } from "@/features/review/api/useReviews"
import type { ReviewTargetType } from "@/client"

interface TinyRatingProps {
  targetType: ReviewTargetType
  targetId: string
}

export function TinyRating({ targetType, targetId }: TinyRatingProps) {
  const rating = useReviewRating({ targetType, targetId })

  if (!rating.data || rating.data.count === 0) return null

  return (
    <span className="inline-flex items-center gap-1">
      <Star className="h-3.5 w-3.5 fill-reward text-reward" />
      <span className="font-semibold text-foreground tabular-nums">
        {rating.data.average.toFixed(1)}
      </span>
      <span className="text-muted-foreground">({rating.data.count})</span>
    </span>
  )
}
