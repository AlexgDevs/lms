import { Layers } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { CourseModulesList } from "./CourseModulesList"

interface CourseSidebarProps {
  courseId: string
  selectedModuleId: string | null
  selectedLessonId: string | null
  onSelectModule: (id: string) => void
  onSelectLesson: (moduleId: string, lessonId: string) => void
}

export function CourseSidebar({ 
  courseId, 
  selectedModuleId, 
  selectedLessonId, 
  onSelectModule, 
  onSelectLesson 
}: CourseSidebarProps) {
  return (
    <aside className="w-80 shrink-0 border border-border/60 bg-card rounded-2xl flex flex-col h-[calc(100vh-140px)] overflow-hidden shadow-sm">
      {/* Шапка сайдбара */}
      <div className="p-3.5 border-b border-border/60 flex items-center justify-between bg-muted/20">
        <div className="flex items-center gap-2">
          <Layers size={16} className="text-primary" />
          <span className="font-semibold text-xs tracking-wider uppercase">
            Структура курса
          </span>
        </div>
      </div>

      {/* Прокручиваемая область с модулями и уроками */}
      <ScrollArea className="flex-1 p-2">
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