import { PanelLeftOpen, Layers } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { ModuleSchema } from "@/client"
import { cn } from "@/lib/utils"

interface LearnSidebarRailProps {
  modules: ModuleSchema[]
  activeModuleId?: string | null
  onExpand: () => void
}

/**
 * Свёрнутое состояние оглавления курса (экран студента):
 * узкий рейл с кнопкой разворота и номерами модулей —
 * зеркало рейла конструктора (CourseSidebarRail).
 */
export function LearnSidebarRail({
  modules,
  activeModuleId,
  onExpand,
}: LearnSidebarRailProps) {
  return (
    <div className="flex h-full min-h-0 w-14 flex-col items-center gap-1 overflow-y-auto py-3">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="mb-1 h-7 w-7 shrink-0 text-muted-foreground"
        onClick={onExpand}
        title="Развернуть оглавление курса"
        aria-label="Развернуть оглавление курса"
      >
        <PanelLeftOpen size={15} />
      </Button>

      <span className="mb-1 h-px w-6 shrink-0 bg-border" />

      {modules.map((module, index) => (
        <button
          key={module.id}
          type="button"
          title={module.title}
          onClick={onExpand}
          className={cn(
            "h-7 w-7 shrink-0 rounded-md text-xs font-semibold tabular-nums transition-colors",
            activeModuleId === module.id
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:bg-muted hover:text-foreground",
          )}
        >
          {index + 1}
        </button>
      ))}

      <span
        className="mt-auto shrink-0 pt-3 text-muted-foreground/40"
        title="Модули курса"
      >
        <Layers size={14} />
      </span>
    </div>
  )
}
