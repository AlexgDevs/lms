import { CheckCircle2, ChevronRight } from "lucide-react"
import type { LessonSchema, ModuleSchema } from "@/client"
import { cn } from "@/lib/utils"

interface LearnSidebarProps {
  courseTitle: string
  modules: ModuleSchema[]
  lessonsByModule: Map<string, LessonSchema[]>
  currentLessonId?: string
  totalLessons: number
  completedCount: number
  isCompleted: (lessonId: string) => boolean
  onSelectLesson: (lessonId: string) => void
}

export function LearnSidebar({
  courseTitle,
  modules,
  lessonsByModule,
  currentLessonId,
  totalLessons,
  completedCount,
  isCompleted,
  onSelectLesson,
}: LearnSidebarProps) {
  const progressPercent = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0

  return (
    <div className="flex flex-col gap-4">
      <aside className="rounded-2xl border border-border/50 bg-card p-4">
        <h2 className="text-sm font-bold text-foreground leading-snug line-clamp-2">{courseTitle}</h2>

        <div className="mt-3 flex items-center gap-2">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground tabular-nums shrink-0">
            {completedCount}/{totalLessons}
          </span>
        </div>
      </aside>

      <nav className="rounded-2xl border border-border/50 bg-card p-2 space-y-3 max-h-[calc(100vh-17rem)] overflow-y-auto">
        {modules.map((module, moduleIndex) => {
          const lessons = lessonsByModule.get(module.id) ?? []
          return (
            <section key={module.id} className="space-y-1">
              <h3 className="px-2 py-1 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                <ChevronRight className="h-3 w-3 text-muted-foreground/60" />
                {moduleIndex + 1}. {module.title}
              </h3>

              <ul className="space-y-0.5">
                {lessons.map((lesson) => {
                  const isActive = lesson.id === currentLessonId
                  const isDone = isCompleted(lesson.id)
                  return (
                    <li key={lesson.id}>
                      <LessonItem
                        lesson={lesson}
                        isActive={isActive}
                        isCompleted={isDone}
                        onClick={() => onSelectLesson(lesson.id)}
                      />
                    </li>
                  )
                })}
              </ul>
            </section>
          )
        })}
      </nav>
    </div>
  )
}

interface LessonItemProps {
  lesson: LessonSchema
  isActive: boolean
  isCompleted: boolean
  onClick: () => void
}

function LessonItem({ lesson, isActive, isCompleted, onClick }: LessonItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full flex items-start gap-2 rounded-lg px-2 py-1.5 text-left text-sm transition-colors",
        isActive
          ? "bg-primary/10 text-foreground font-medium"
          : isCompleted
            ? "bg-muted/60 text-muted-foreground"
            : "text-foreground/75 hover:bg-muted/60 hover:text-foreground",
      )}
    >
      <CheckCircle2
        className={cn(
          "mt-0.5 h-4 w-4 shrink-0",
          isActive
            ? "text-primary"
            : isCompleted
              ? "text-emerald-600/80 dark:text-emerald-400/80"
              : "text-muted-foreground/50",
        )}
      />
      <span className={cn("truncate", isActive && "text-foreground")}>{lesson.title}</span>
    </button>
  )
}