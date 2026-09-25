import { cn } from "@/lib/utils"
import { useInView } from "@/lib/useInView"

interface FounderBonusItemProps {
  number: string
  title: string
  text: string
  index?: number
}

export function FounderBonusItem({ number, title, text, index = 0 }: FounderBonusItemProps) {
  const { ref, inView } = useInView<HTMLDivElement>(0.2)

  return (
    <div
      ref={ref}
      className={cn(
        "space-y-2 rounded-2xl bg-card p-5 text-left shadow-[var(--shadow-card)]",
        "opacity-0 translate-y-4 transition-all duration-500 ease-out",
        inView && "opacity-100 translate-y-0",
      )}
      style={{ transitionDelay: `${index * 120}ms` }}
    >
      <span className="font-mono text-sm font-bold tracking-widest text-foreground/80">
        {number}
      </span>
      <h3 className="text-sm font-bold text-foreground">{title}</h3>
      <p className="text-xs leading-relaxed text-muted-foreground">{text}</p>
    </div>
  )
}
