import { useState } from "react"
import { notFound, useParams, useNavigate } from "@tanstack/react-router"
import { Loader2, ArrowLeft, Folder, Layers } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { useCourses } from "@/features/teaching/api/useCourses"
import { useCourseMedia } from "@/features/teaching/api/useCourseMedia"
import { useModules } from "@/features/teaching/api/useModules"
import { useTgp, TGP_MIN_MODULES } from "@/features/teaching/api/useTgp"
import { TGP_GENERATION_COOLDOWN_HOURS } from "@/lib/tgp"
import { CourseHeader } from "@/features/teaching/components/builder/CourseHeader"
import { CourseSidebar } from "@/features/teaching/components/builder/CourseSidebar"
import { TgpPanel } from "@/features/teaching/components/builder/TgpPanel"
import { CertificatePanel } from "@/features/teaching/components/builder/CertificatePanel"
import { ROUTES } from "@/routes"
import { CourseBlocks } from "@/features/teaching/components/builder/CourseBlocks"

const SIDEBAR_COLLAPSED_KEY = "teaching:builder:sidebar-collapsed"

function readSidebarCollapsed(): boolean {
  try {
    return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "1"
  } catch {
    return false
  }
}

export function CourseBuilderPage() {
  const { courseId } = useParams({ strict: false })
  const navigate = useNavigate()

  // Храним выбранный модуль и выбранный урок
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null)
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  // Свёрнутый сайдбар (режим фокуса) — состояние между сессиями
  const [sidebarCollapsed, setSidebarCollapsed] = useState(readSidebarCollapsed)

  const toggleSidebarCollapsed = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev
      try {
        localStorage.setItem(SIDEBAR_COLLAPSED_KEY, next ? "1" : "0")
      } catch {
        // localStorage может быть недоступен (private mode) — не критично
      }
      return next
    })
  }

  // Забираем данные из хука
  const {
    authorCourse,
    isLoadingAuthorCourse,
    updateCourseAsync,
    isUpdatingCourse,
    submitCourseForReviewAsync,
    isSubmittingCourseForReview,
  } = useCourses(courseId)

   // Медиа курса: обложка (загрузка / удаление)
  const {
    uploadCourseCoverAsync,
    removeCourseCoverAsync,
    isUploadingCover,
    isRemovingCover,
  } = useCourseMedia(courseId)

  // TGP (The Gold Path) — pre-testing hooks
  const tgp = useTgp({ courseId })
  const { modules } = useModules({ courseId: courseId ?? "", onlyCreated: true })

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
  if (!authorCourse) {
    throw notFound()
  }

  // Хендлер обновления курса
  const handleUpdateCourse = async (data: {
    title?: string
    description?: string | null
    price?: number | null
    status?: "draft"
    category_id?: string | null
    tgp_enabled?: boolean
    tgp_cooldown_hours?: number
    certificate_enabled?: boolean
  }) => {
    await updateCourseAsync({
      path: { course_id: String(authorCourse.id) },
      body: data,
    })
  }

  const handleSubmitReview = async () => {
    await submitCourseForReviewAsync({
      path: { course_id: String(authorCourse.id) },
    })
  }

  // --- TGP handlers ---
  const handleToggleTgp = async (enabled: boolean) => {
    await handleUpdateCourse({ tgp_enabled: enabled })
  }

  const handleToggleCertificate = async (enabled: boolean) => {
    await handleUpdateCourse({ certificate_enabled: enabled })
  }

  const handleGenerate = async () => {
    await tgp.generateAsync()
  }

  const handleSaveQuestion = async (
    questionId: string,
    data: {
      question_text: string
      options: string[]
      correct_option: number
    }
  ) => {
    await tgp.updateAsync(questionId, data)
  }

  const handleRegenerate = async (questionId: string) => {
    await tgp.regenerateAsync(questionId)
  }

  const handleRefetchTgp = async () => {
    const res = await tgp.refetchQuestions()
    return res.data
  }

  const tgpEnabled = Boolean(authorCourse?.tgp_enabled)
  const certificateEnabled = Boolean(authorCourse?.certificate_enabled)

  return (
    <div className="w-full bg-card text-foreground flex flex-col min-h-[calc(100vh-7rem)]">

      {/* Верхняя полоса конструктора — липкая, на белом холсте */}
      <div className="sticky top-16 z-30 bg-card/95 backdrop-blur-sm border-b border-border/60 px-4 py-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate({ to: ROUTES.TEACHING })}
            className="h-8 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft size={13} />
            <span>К курсам</span>
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={() => setSidebarOpen(true)}
            className="h-8 text-xs gap-1.5 lg:hidden"
          >
            <Layers size={14} />
            Редактировать структуру
          </Button>
        </div>
      </div>

      {/* Рабочая область: сворачиваемый сайдбар + единый белый холст */}
      <div className="flex-1 flex flex-col lg:flex-row lg:items-stretch">

        {/* Левый сайдбар — sticky, сворачиваемый в узкий рейл (режим фокуса) */}
        <div className="hidden lg:block shrink-0 border-r border-border/60">
          <div className="sticky top-[7rem] h-[calc(100vh-7rem)]">
            <CourseSidebar
              courseId={courseId}
              selectedModuleId={selectedModuleId}
              selectedLessonId={selectedLessonId}
              collapsed={sidebarCollapsed}
              onToggleCollapsed={toggleSidebarCollapsed}
              className="h-full"
              onSelectModule={(id) => {
                setSelectedModuleId(id)
              }}
              onSelectLesson={(moduleId, lessonId) => {
                setSelectedModuleId(moduleId)
                setSelectedLessonId(lessonId)
              }}
            />
          </div>
        </div>

        {/* Правая колонка: шапка курса + белый холст (скроллится страницей) */}
        <main className="flex-1 min-w-0 flex flex-col">

          {/* Шапка курса: обложка, название, статус, публикация и настройки */}
          <CourseHeader
            course={authorCourse}
            onUpdateCourse={handleUpdateCourse}
            isUpdating={isUpdatingCourse}
            onSubmitReview={handleSubmitReview}
            isSubmittingReview={isSubmittingCourseForReview}
            onUploadCover={uploadCourseCoverAsync}
            onRemoveCover={removeCourseCoverAsync}
            isUploadingCover={isUploadingCover || isRemovingCover}
            settingsExtra={
              <>
                <CertificatePanel
                  plain
                  certificateEnabled={certificateEnabled}
                  isUpdatingCourse={isUpdatingCourse}
                  onToggleCertificate={handleToggleCertificate}
                />

                <TgpPanel
                  plain
                  courseId={String(authorCourse.id)}
                  tgpEnabled={tgpEnabled}
                  tgpLastGeneratedAt={
                    authorCourse?.tgp_last_full_generated_at ??
                    tgp.optimisticGeneratedAt ??
                    null
                  }
                  tgpCooldownHours={Math.max(
                    authorCourse?.tgp_cooldown_hours ?? TGP_GENERATION_COOLDOWN_HOURS,
                    TGP_GENERATION_COOLDOWN_HOURS,
                  )}
                  moduleCount={modules.length}
                  minModules={TGP_MIN_MODULES}
                  questions={tgp.questions ?? []}
                  isLoadingQuestions={tgp.isLoadingQuestions}
                  isGenerating={tgp.isGenerating}
                  isUpdatingCourse={tgp.isTogglingTgp || isUpdatingCourse}
                  isSavingQuestion={tgp.isUpdatingQuestion}
                  isRegenerating={tgp.isRegenerating}
                  onToggleTgp={handleToggleTgp}
                  onGenerate={handleGenerate}
                  onSaveQuestion={handleSaveQuestion}
                  onRegenerate={handleRegenerate}
                  onRefetch={handleRefetchTgp}
                />
              </>
            }
          />

          {/* Центральный холст редактора */}
          <div className="flex-1 flex flex-col">
            {selectedLessonId ? (
              // СНАЧАЛА проверяем урок, так как он приоритетнее
              <CourseBlocks
                courseId={courseId}
                lessonId={selectedLessonId}
              />
            ) : selectedModuleId ? (
              // ПОТОМ проверяем модуль, если урок не выбран
              <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-24">
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-md bg-reward/10 text-reward flex items-center justify-center mx-auto">
                    <Folder size={20} />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold">Редактирование модуля</h3>
                    <p className="text-xs font-mono text-muted-foreground">
                      Module ID: {selectedModuleId}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              // Ничего не выбрано
              <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-24">
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
          </div>
        </main>
      </div>

      {/* Структура курса — мобильная шторка */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="p-0 gap-0 w-[85%] sm:max-w-sm overflow-hidden">
          <SheetHeader className="px-4 py-3.5 border-b border-border shrink-0">
            <SheetTitle className="flex items-center gap-2 text-sm">
              <Layers size={16} className="text-primary" />
              Структура курса
            </SheetTitle>
          </SheetHeader>
          <div className="flex-1 min-h-0 overflow-hidden">
            <CourseSidebar
              courseId={courseId}
              selectedModuleId={selectedModuleId}
              selectedLessonId={selectedLessonId}
              fill
              onSelectModule={(id) => {
                setSelectedModuleId(id)
                setSidebarOpen(false)
              }}
              onSelectLesson={(moduleId, lessonId) => {
                setSelectedModuleId(moduleId)
                setSelectedLessonId(lessonId)
                setSidebarOpen(false)
              }}
            />
          </div>
        </SheetContent>
      </Sheet>

    </div>
  )
}