import * as React from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

interface AsidePanelProps {
  /** Fixed (non-scrolling) top strip, e.g. panel title or course info. */
  header?: React.ReactNode
  children: React.ReactNode
  className?: string
  bodyClassName?: string
  /** Width utility for the fixed-width (non-fill) column, e.g. "w-80". */
  widthClassName?: string
  /** Render full-width (inside a mobile Sheet) instead of a fixed-width column. */
  fill?: boolean
}

/**
 * Shared aside shell: a fixed-height column whose header stays put while the
 * body (the module/lesson tree) scrolls independently. Used by both the course
 * builder and the learning page so the two panels look and behave the same.
 */
export function AsidePanel({
  header,
  children,
  className,
  bodyClassName,
  widthClassName,
  fill = false,
}: AsidePanelProps) {
  return (
    <aside
      className={cn(
        "bg-card flex flex-col h-full min-h-0 overflow-hidden rounded-xl shadow-[var(--shadow-card)]",
        fill ? "w-full" : cn("shrink-0", widthClassName ?? "w-80"),
        className,
      )}
    >
      {header != null && (
        <div className="shrink-0 border-b border-border/50 bg-muted/20 px-3.5 py-3">
          {header}
        </div>
      )}
      <ScrollArea className={cn("flex-1 min-h-0", bodyClassName)}>
        {children}
      </ScrollArea>
    </aside>
  )
}
