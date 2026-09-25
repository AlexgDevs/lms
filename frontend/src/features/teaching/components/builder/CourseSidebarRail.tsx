import { PanelLeftOpen, Layers } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useModules } from "@/features/teaching/api/useModules"
import { cn } from "@/lib/utils"

interface CourseSidebarRailProps {
  courseId: string
  activeModuleId: string | null
  onSelectModule: (moduleId: string) => void
  onExpand: () => void
}

/**
 * Свёрнутое состояние структуры курса: узкий рейл с номерами модулей.
 * Клик по номеру выбирает модуль и одновременно разворачивает панель.
 */
export function CourseSidebarRail({
  courseId,
  activeModuleId,
  onSelectModule,
  onExpand,
}: CourseSidebarRailProps) {
  const { modules, isLoadingModules } = useModules({ courseId, onlyCreated: true })

  return (
    <div className="flex h-full min-h-0 w-14 flex-col items-center gap-1 overflow-y-auto py-3">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="mb-1 h-7 w-7 shrink-0 text-muted-foreground"
        onClick={onExpand}
        title="Развернуть структуру курса"
        aria-label="Развернуть структуру курса"
      >
        <PanelLeftOpen size={15} />
      </Button>

      <span className="mb-1 h-px w-6 shrink-0 bg-border" />

      {!isLoadingModules &&
        modules.map((module, index) => (
          <button
            key={module.id}
            type="button"
            title={module.title}
            onClick={() => {
              onSelectModule(module.id)
              onExpand()
            }}
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
