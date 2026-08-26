import { Star } from "lucide-react"
import { cn } from "@/lib/utils"

interface CatalogRatingFilterProps {
  value: number
  onChange: (value: number) => void
}

export function CatalogRatingFilter({ value, onChange }: CatalogRatingFilterProps) {
  return (
    <div>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => {
          const filled = value >= star
          return (
            <button
              key={star}
              type="button"
              title={`${star}★ и выше`}
              onClick={() => onChange(value === star ? 0 : star)}
              className={cn(
                "inline-flex p-0.5 transition-transform hover:scale-110 cursor-pointer",
                filled && "relative"
              )}
            >
              <Star
                className={cn(
                  "h-4 w-4",
                  filled ? "fill-reward text-reward" : "fill-transparent text-muted-foreground/40"
                )}
              />
            </button>
          )
        })}
      </div>
      <p className="mt-1 text-[11px] text-muted-foreground">
        {value === 0 ? "Любой рейтинг" : `От ${value}★ и выше`}
      </p>
    </div>
  )
}
