import { useEffect, useRef, type ReactNode } from "react"
import { cn } from "@/lib/utils"

interface SnapSectionProps {
  id?: string
  index: number
  onActive: (index: number) => void
  className?: string
  /** Outlined watermark shown behind the content (e.g. "01", "STUDIO"). */
  watermark?: string
  watermarkClassName?: string
  children: ReactNode
}

/**
 * Full-viewport slide of a block landing (scroll-snap target).
 * Reports `index` when the section crosses the middle of the screen
 * so the page can highlight the matching nav dot.
 */
export function SnapSection({
  id,
  index,
  onActive,
  className,
  watermark,
  watermarkClassName,
  children,
}: SnapSectionProps) {
  const ref = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          onActive(index)
        }
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [index, onActive])

  return (
    <section
      id={id}
      ref={ref}
      className={cn(
        "relative flex min-h-dvh w-full snap-start flex-col items-center justify-center overflow-hidden px-6 py-16 text-center",
        className,
      )}
    >
      {watermark && (
        <span
          aria-hidden
          className={cn(
            "pointer-events-none absolute left-1/2 top-1/2 z-0 -translate-x-1/2 -translate-y-1/2 select-none font-mono font-black leading-none",
            watermarkClassName ?? "text-[24vw]",
          )}
          style={{
            color: "transparent",
            WebkitTextStroke: "1.5px var(--muted-foreground)",
            opacity: 0.07,
          }}
        >
          {watermark}
        </span>
      )}
      {children}
    </section>
  )
}
