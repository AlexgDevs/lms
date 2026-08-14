import { useState } from "react"
import { useParams, useNavigate } from "@tanstack/react-router"
import { Loader2, AlertCircle, ArrowLeft, Folder } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCourses } from "@/features/teaching/api/useCourses"
import { useCourseMedia } from "@/features/teaching/api/useCourseMedia"
import { CourseHeader } from "@/features/teaching/components/builder/CourseHeader"
import { CourseSidebar } from "@/features/teaching/components/builder/CourseSidebar"
import { ROUTES } from "@/routes"
import { CourseBlocks } from "@/features/teaching/components/builder/CourseBlocks"

export function CourseBuilderPage() {
  const { courseId } = useParams({ strict: false })
  const navigate = useNavigate()

  // Храним выбранный модуль и выбранный урок
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null)
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null)

  // Забираем данные из хука
  const {
    authorCourse,
    isLoadingAuthorCourse,
    authorCourseError,
    updateCourseAsync,
    isUpdatingCourse,
  } = useCourses(courseId)

  // Медиа курса: обложка (загрузка / удаление)
  const {
    uploadCourseCoverAsync,
    removeCourseCoverAsync,
    isUploadingCover,
    isRemovingCover,
  } = useCourseMedia(courseId)

  if (!courseId) {
    navigate({ to: ROUTES.TEACHING })
    return null
  }

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
    status?: "draft" | "published"
    category_id?: string | null
  }) => {
    await updateCourseAsync({
      path: { course_id: String(authorCourse.id) },
      body: data,
    })
  }

  return (
    <div className="h-screen w-full bg-background text-foreground flex flex-col overflow-hidden">
      
      {/* Верхний тулбар: кнопка назад + ID */}
      <div className="shrink-0 bg-muted/30 px-4 py-1.5 flex items-center justify-between">
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
            onUploadCover={uploadCourseCoverAsync}
            onRemoveCover={removeCourseCoverAsync}
            isUploadingCover={isUploadingCover || isRemovingCover}
          />
        </div>

        {/* Рабочая область: Сайдбар + Центральный холст */}
        <div className="flex-1 flex gap-4 overflow-hidden">
          
          {/* Левый Сайдбар (Модули и Уроки) */}
          <CourseSidebar
            courseId={courseId}
            selectedModuleId={selectedModuleId}
            selectedLessonId={selectedLessonId}
            onSelectModule={(id) => {
              setSelectedModuleId(id)
              // Сбрасываем выбранный урок при переключении модуля, если это необходимо
            }}
            onSelectLesson={(moduleId, lessonId) => {
              setSelectedModuleId(moduleId)
              setSelectedLessonId(lessonId)
            }}
          />

          {/* Центральный редактор контента */}
          {/* Центральный редактор контента */}
          <main className="flex-1 rounded-xl bg-card overflow-hidden shadow-[var(--shadow-card)] flex flex-col">
            {selectedLessonId ? (
              // СНАЧАЛА проверяем урок, так как он приоритетнее
              <CourseBlocks
                courseId={courseId}
                lessonId={selectedLessonId}
              />
            ) : selectedModuleId ? (
              // ПОТОМ проверяем модуль, если урок не выбран
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-md bg-reward/10 text-reward flex items-center justify-center mx-auto">
                    <Folder size={20} />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold">Редактирование модуля</h3>
                    <p className="text-xs font-mono text-muted-foreground bg-muted/30 px-3 py-1 rounded-md">
                      Module ID: {selectedModuleId}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              // Ничего не выбрано
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
                <div className="max-w-sm space-y-1.5">
                  <p className="text-sm font-semibold text-foreground">
                    Выберите модуль или урок слева
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Нажмите на элемент структуры курса, чтобы открыть его настройки и редактирование.
                  </p>
                </div>
              </div>
            )}
          </main>

        </div>

      </div>

    </div>
  )
}