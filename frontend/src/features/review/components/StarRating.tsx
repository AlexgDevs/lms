import { Star } from "lucide-react"
import { cn } from "@/lib/utils"

interface StarRatingProps {
  value: number
  onChange?: (value: number) => void
  size?: number
  readonly?: boolean
  className?: string
}

export function StarRating({
  value,
  onChange,
  size = 18,
  readonly = false,
  className,
}: StarRatingProps) {
  const rounded = Math.round(value)

  const renderStar = (index: number) => {
    const filled = index <= rounded
    const star = (
      <Star
        style={{ width: size, height: size }}
        className={cn(
          "transition-colors",
          filled ? "fill-reward text-reward" : "fill-transparent text-muted-foreground/40",
          !readonly && "cursor-pointer hover:scale-110"
        )}
      />
    )

    if (readonly || !onChange) return star

    return (
      <span
        key={index}
        role="button"
        tabIndex={0}
        aria-label={`Оценить на ${index}`}
        onClick={() => onChange(index)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            onChange(index)
          }
        }}
        className={cn("inline-flex", !readonly && "cursor-pointer")}
      >
        {star}
      </span>
    )
  }

  return (
    <div className={cn("inline-flex items-center gap-0.5", className)}>
      {[1, 2, 3, 4, 5].map((index) => (
        <span key={index}>{renderStar(index)}</span>
      ))}
    </div>
  )
}
