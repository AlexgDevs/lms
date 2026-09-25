import { Layers, PanelLeftClose } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AsidePanel } from "@/components/layout/AsidePanel"
import { cn } from "@/lib/utils"
import { CourseModulesList } from "./CourseModulesList"
import { CourseSidebarRail } from "./CourseSidebarRail"

interface CourseSidebarProps {
  courseId: string
  selectedModuleId: string | null
  selectedLessonId: string | null
  onSelectModule: (id: string) => void
  onSelectLesson: (moduleId: string, lessonId: string) => void
  /** Render the panel full-width (used inside a mobile Sheet) instead of a fixed-width column. */
  fill?: boolean
  className?: string
  /** Collapsed (rail) state — desktop only. */
  collapsed?: boolean
  /** Toggle handler for the collapse arrow in the panel header. */
  onToggleCollapsed?: () => void
}

export function CourseSidebar({
  courseId,
  selectedModuleId,
  selectedLessonId,
  onSelectModule,
  onSelectLesson,
  fill = false,
  className,
  collapsed = false,
  onToggleCollapsed,
}: CourseSidebarProps) {
  // Свёрнутый режим (десктоп): узкий рейл вместо полной панели
  if (collapsed && !fill) {
    return (
      <div className={cn("w-14 h-full shrink-0", className)}>
        <CourseSidebarRail
          courseId={courseId}
          activeModuleId={selectedModuleId}
          onSelectModule={onSelectModule}
          onExpand={onToggleCollapsed ?? (() => {})}
        />
      </div>
    )
  }

  return (
    <AsidePanel
      flat={!fill}
      fill={fill}
      className={className}
      bodyClassName="p-2"
      header={
        <div className="flex items-center gap-2">
          <Layers size={16} className="text-primary" />
          <span className="flex-1 font-semibold text-xs tracking-wider uppercase">
            Структура курса
          </span>
          {!fill && onToggleCollapsed && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0 text-muted-foreground"
              onClick={onToggleCollapsed}
              title="Свернуть структуру (режим фокуса)"
              aria-label="Свернуть структуру курса"
            >
              <PanelLeftClose size={14} />
            </Button>
          )}
        </div>
      }
    >
      <CourseModulesList
        courseId={courseId}
        activeModuleId={selectedModuleId || undefined}
        activeLessonId={selectedLessonId || undefined}
        onSelectModule={onSelectModule}
        onSelectLesson={onSelectLesson}
      />
    </AsidePanel>
  )
}
