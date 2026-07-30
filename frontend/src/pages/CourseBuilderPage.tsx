import { useState } from "react"
import { useParams, useNavigate } from "@tanstack/react-router"
import { Loader2, AlertCircle, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCourses } from "@/hooks/useCourses"
import { CourseHeader } from "@/components/course_builder/CourseHeader"
import { CourseSidebar } from "@/components/course_builder/CourseSidebar"
import { ROUTES } from "@/routes"

export function CourseBuilderPage() {
  const { courseId } = useParams({ strict: false })
  const navigate = useNavigate()

  // Храним выбранный элемент (модуль или урок)
  const [selectedItem, setSelectedItem] = useState<{
    id: string
    type: "module" | "lesson"
  } | null>(null)

  if (!courseId) {
    navigate({ to: ROUTES.TEACHING })
    return null
  }

  // Забираем данные из обновленного хука (используем прокинутые алиасы)
  const {
    authorCourse,
    isLoadingAuthorCourse,
    authorCourseError,
    updateCourseAsync,
    isUpdatingCourse,
  } = useCourses(courseId)

  // 1. Состояние загрузки
  if (isLoadingAuthorCourse) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="text-sm font-medium text-muted-foreground">
            Загрузка конструктора курса...
          </span>
        </div>
      </div>
    )
  }

  // 2. Обработка ошибки
  if (authorCourseError || !authorCourse) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center gap-4 bg-background p-4">
        <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center text-destructive">
          <AlertCircle size={24} />
        </div>
        <div className="text-center space-y-1">
          <h2 className="text-lg font-bold text-foreground">
            Курс не найден
          </h2>
          <p className="text-xs text-muted-foreground max-w-sm">
            Не удалось загрузить курс. Возможно, он был удален или у вас нет прав автора.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate({ to: ROUTES.TEACHING })}
          className="gap-2"
        >
          <ArrowLeft size={14} />
          <span>Вернуться к спискам курсов</span>
        </Button>
      </div>
    )
  }

  // Хендлер обновления курса
  const handleUpdateCourse = async (data: {
    title?: string
    description?: string | null
    price?: number | null
    is_published?: boolean
  }) => {
    await updateCourseAsync({
      path: { course_id: String(authorCourse.id) },
      body: data,
    })
  }

  return (
    <div className="h-screen w-full bg-background text-foreground flex flex-col overflow-hidden">
      
      {/* Верхний тулбар: кнопка назад + ID */}
      <div className="shrink-0 border-b border-border/40 bg-muted/30 px-4 py-1.5 flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate({ to: ROUTES.TEACHING })}
          className="h-7 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft size={13} />
          <span>К курсам</span>
        </Button>
        <span className="text-[11px] font-mono text-muted-foreground">
          ID: {authorCourse.id}
        </span>
      </div>

      {/* Основной контент-контейнер */}
      <div className="flex-1 flex flex-col p-4 gap-4 overflow-hidden">
        
        {/* Компактная шапка курса */}
        <div className="shrink-0">
          <CourseHeader
            course={authorCourse}
            onUpdateCourse={handleUpdateCourse}
            isUpdating={isUpdatingCourse}
          />
        </div>

        {/* Рабочая область: Сайдбар + Центральный холст */}
        <div className="flex-1 flex gap-4 overflow-hidden">
          
          {/* Левый Сайдбар (Дерево структуры) */}
          <CourseSidebar
            selectedId={selectedItem?.id || null}
            onSelect={(id, type) => setSelectedItem({ id, type })}
          />

          {/* Центральный редактор контента */}
          <main className="flex-1 rounded-2xl border border-border/60 bg-card p-6 overflow-y-auto shadow-sm flex flex-col items-center justify-center text-center">
            {selectedItem ? (
              <div className="space-y-2">
                <h3 className="text-lg font-bold">
                  Редактирование {selectedItem.type === "module" ? "Модуля" : "Урока"}
                </h3>
                <p className="text-xs font-mono text-muted-foreground bg-muted/30 px-3 py-1 rounded-lg">
                  ID: {selectedItem.id}
                </p>
              </div>
            ) : (
              <div className="max-w-sm space-y-1.5">
                <p className="text-sm font-semibold text-foreground">
                  Выберите элемент слева
                </p>
                <p className="text-xs text-muted-foreground">
                  Нажмите на модуль или урок в структуре курса, чтобы открыть настройки и конструктор блоков по центру.
                </p>
              </div>
            )}
          </main>

        </div>

      </div>

    </div>
  )
}