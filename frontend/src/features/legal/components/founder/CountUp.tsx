import { cn } from "@/lib/utils"
import { useInView } from "@/features/legal/components/founder/useInView"
import { useCountUp } from "@/features/legal/components/founder/useCountUp"

interface CountUpProps {
  value: number
  format?: (value: number) => string
  className?: string
}

/** Big animated number that starts counting once it scrolls into view. */
export function CountUp({ value, format, className }: CountUpProps) {
  const { ref, inView } = useInView<HTMLSpanElement>(0.5)
  const current = useCountUp(value, inView)

  return (
    <span ref={ref} className={cn("tabular-nums", className)}>
      {format ? format(current) : current.toLocaleString("ru-RU")}
    </span>
  )
}
