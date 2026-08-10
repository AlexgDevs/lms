import { useState, useEffect } from "react"
import { Plus, GripVertical, FileText, Loader2, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useLessons } from "@/features/teaching/api/useLessons"
import { useReorderableList } from "@/lib/dnd"

interface Lesson {
  id: string
  title: string
}

interface CourseLessonsListProps {
  courseId: string
  moduleId: string
  selectedLessonId: string | null
  autoAdd?: boolean
  onSelectLesson: (id: string) => void
  onResetAutoAdd?: () => void
}

export function CourseLessonsList({
  courseId,
  moduleId,
  selectedLessonId,
  autoAdd = false,
  onSelectLesson,
  onResetAutoAdd,
}: CourseLessonsListProps) {
  const {
    lessons,
    isLoadingLessons,
    createLessonAsync,
    isCreatingLesson,
    deleteLessonAsync,
    isDeletingLesson,
    reorderLessonsAsync,
    isReordering,
  } = useLessons({
    courseId,
    moduleId,
    onlyCreated: true,
  })

  // Переупорядочивание уроков (drag & drop)
  const lessonList = useReorderableList(
    (lessons as Lesson[]) || [],
    (orderedIds) => {
      reorderLessonsAsync(orderedIds).catch((e) => {
        console.error("Ошибка при переупорядочивании уроков:", e)
      })
    },
    isReordering,
  )

  const [isAddingLesson, setIsAddingLesson] = useState(false)
  const [newLessonTitle, setNewLessonTitle] = useState("")

  // Реагируем на триггер "autoAdd" из родителя (при клике на + на самом модуле)
  useEffect(() => {
    if (autoAdd) {
      setIsAddingLesson(true)
    }
  }, [autoAdd])

  const handleCloseAdding = () => {
    setIsAddingLesson(false)
    setNewLessonTitle("")
    onResetAutoAdd?.()
  }

  // Хендлер создания урока
  const handleCreateLesson = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()

    const trimmedTitle = newLessonTitle.trim()
    if (!trimmedTitle || isCreatingLesson) return

    try {
      await createLessonAsync(trimmedTitle)
      handleCloseAdding()
    } catch (err) {
      console.error("Ошибка при создании урока:", err)
    }
  }

  // Хендлер удаления урока
  const handleDeleteLesson = async (e: React.MouseEvent, lessonId: string) => {
    e.stopPropagation()

    try {
      await deleteLessonAsync({
        path: {
          course_id: courseId,
          module_id: moduleId,
          lesson_id: lessonId,
        },
      })
    } catch (err) {
      console.error("Ошибка при удалении урока:", err)
    }
  }

  return (
    <div className="pl-4 pr-1 py-1 space-y-1">
      {/* Состояние загрузки */}
      {isLoadingLessons ? (
        <div className="flex items-center justify-center p-3 text-muted-foreground gap-2 text-[11px]">
          <Loader2 className="animate-spin" size={13} />
          <span>Загрузка уроков...</span>
        </div>
      ) : (
        <>
          {/* Список уроков */}
          {(lessons as Lesson[])?.map((lesson, index) => {
            const isSelected = selectedLessonId === lesson.id

            return (
              <div
                key={lesson.id}
                onDragOver={(e) => lessonList.dragOver(e, lesson.id)}
                onDrop={(e) => lessonList.drop(e, lesson.id)}
                className={`group flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                  lessonList.draggingId === lesson.id
                    ? "opacity-40"
                    : lessonList.overId === lesson.id
                      ? "ring-1 ring-primary/40 bg-muted/40"
                      : isSelected
                        ? "bg-primary/10 text-primary font-semibold"
                        : "hover:bg-muted/60 text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => onSelectLesson(lesson.id)}
              >
                <span
                  draggable
                  onDragStart={(e) => lessonList.beginDrag(e, lesson.id)}
                  onDragEnd={lessonList.dragEnd}
                  className="opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing shrink-0 transition-opacity select-none"
                >
                  <GripVertical size={13} className="text-muted-foreground/30" />
                </span>

                <FileText size={14} className="text-blue-500 shrink-0" />

                <span className="truncate flex-1">
                  {index + 1}. {lesson.title}
                </span>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={isDeletingLesson}
                  className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                  onClick={(e) => handleDeleteLesson(e, lesson.id)}
                >
                  <Trash2 size={12} />
                </Button>
              </div>
            )
          })}

          {/* Пустое состояние */}
          {!isLoadingLessons && (!lessons || lessons.length === 0) && !isAddingLesson && (
            <div className="p-2 text-center text-[11px] text-muted-foreground/70">
              Уроков пока нет
            </div>
          )}
        </>
      )}

      {/* Инпут добавления нового урока */}
      {isAddingLesson ? (
        <form
          onSubmit={handleCreateLesson}
          className="p-2 border border-dashed border-primary/40 rounded-xl bg-primary/5 space-y-2 mt-1"
        >
          <Input
            placeholder="Название урока..."
            value={newLessonTitle}
            onChange={(e) => setNewLessonTitle(e.target.value)}
            className="h-7 text-xs bg-background"
            autoFocus
            disabled={isCreatingLesson}
            onKeyDown={(e) => {
              if (e.key === "Escape") handleCloseAdding()
            }}
          />
          <div className="flex items-center justify-end gap-1.5">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-6 text-[11px] px-2"
              disabled={isCreatingLesson}
              onClick={handleCloseAdding}
            >
              Отмена
            </Button>
            <Button
              type="submit"
              size="sm"
              className="h-6 text-[11px] px-2.5 gap-1"
              disabled={isCreatingLesson || !newLessonTitle.trim()}
            >
              {isCreatingLesson && <Loader2 size={11} className="animate-spin" />}
              Создать
            </Button>
          </div>
        </form>
      ) : (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="w-full h-6 text-[11px] justify-start text-muted-foreground hover:text-foreground gap-1 px-2.5 mt-1 rounded-lg"
          onClick={() => setIsAddingLesson(true)}
        >
          <Plus size={12} />
          <span>Добавить урок</span>
        </Button>
      )}
    </div>
  )
}