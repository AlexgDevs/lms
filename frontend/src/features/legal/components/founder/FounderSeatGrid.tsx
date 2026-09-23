import { cn } from "@/lib/utils"
import { useInView } from "@/features/legal/components/founder/useInView"

interface FounderSeatGridProps {
  value: number
  max: number
}

/**
 * `max` seats rendered as a grid; the first `value` are filled with the
 * theme foreground color ("taken"). Cells pop in with a stagger when the
 * grid scrolls into view.
 */
export function FounderSeatGrid({ value, max }: FounderSeatGridProps) {
  const { ref, inView } = useInView<HTMLDivElement>(0.3)
  const filledCount = Math.min(Math.max(value, 0), max)

  return (
    <div
      ref={ref}
      aria-hidden
      className="mx-auto grid w-fit grid-cols-6 gap-2 sm:gap-2.5"
    >
      {Array.from({ length: max }, (_, i) => {
        const filled = i < filledCount
        return (
          <div
            key={i}
            className={cn(
              "h-11 w-11 rounded-xl transition-all duration-500 ease-out sm:h-12 sm:w-12",
              inView ? "scale-100 opacity-100" : "scale-75 opacity-0",
              filled
                ? "border border-foreground bg-foreground shadow-md"
                : "border border-dashed border-muted-foreground/25 bg-muted/20",
            )}
            style={{ transitionDelay: `${i * 45}ms` }}
          />
        )
      })}
    </div>
  )
}
