import { Layers } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { CourseModulesList } from "./CourseModulesList"

interface CourseSidebarProps {
  courseId: string
  selectedModuleId: string | null
  selectedLessonId: string | null
  onSelectModule: (id: string) => void
  onSelectLesson: (moduleId: string, lessonId: string) => void
  /** Render the panel full-width (used inside a mobile Sheet) instead of a fixed-width column. */
  fill?: boolean
  className?: string
}

export function CourseSidebar({ 
  courseId, 
  selectedModuleId, 
  selectedLessonId, 
  onSelectModule, 
  onSelectLesson,
  fill = false,
  className,
}: CourseSidebarProps) {
  return (
    <aside className={cn(
      "bg-card rounded-xl flex flex-col h-full min-h-0 overflow-hidden shadow-[var(--shadow-card)]",
      fill ? "w-full" : "w-max min-w-72 max-w-[20rem] shrink-0",
      className,
    )}>
      {/* Шапка сайдбара */}
      <div className="p-3.5 flex items-center justify-between bg-muted/20">
        <div className="flex items-center gap-2">
          <Layers size={16} className="text-primary" />
          <span className="font-semibold text-xs tracking-wider uppercase">
            Структура курса
          </span>
        </div>
      </div>

      {/* Прокручиваемая область с модулями и уроками */}
      <ScrollArea className="flex-1 p-2 min-h-0">
        <CourseModulesList
          courseId={courseId}
          activeModuleId={selectedModuleId || undefined}
          activeLessonId={selectedLessonId || undefined}
          onSelectModule={onSelectModule}
          onSelectLesson={onSelectLesson}
        />
      </ScrollArea>
    </aside>
  )
}