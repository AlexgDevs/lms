import { Layers } from "lucide-react"
import { AsidePanel } from "@/components/layout/AsidePanel"
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
    <AsidePanel
      fill={fill}
      className={className}
      bodyClassName="p-2"
      header={
        <div className="flex items-center gap-2">
          <Layers size={16} className="text-primary" />
          <span className="font-semibold text-xs tracking-wider uppercase">
            Структура курса
          </span>
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
