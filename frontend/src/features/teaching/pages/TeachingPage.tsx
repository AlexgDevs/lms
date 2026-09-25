import { useState } from "react"
import {
  Plus,
  Users,
  DollarSign,
  Star,
  Edit3,
  BarChart2,
  Layers,
  ChevronRight,
  ChevronDown,
  Sparkle,
  Loader2,
  BookOpen,
  Trash2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { useNavigate, Link } from "@tanstack/react-router"
import {
  useCreatedCoursesPage,
  useCourses,
} from "@/features/teaching/api/useCourses"
import { CreateCourseForm } from "@/features/teaching/components/CreateCourseForm"
import { CourseGenerateCard } from "@/features/teaching/components/CourseGenerateCard"
import { resolveMediaUrl } from "@/lib/media"
import { ROUTES } from "@/routes"
import { CourseStatus, type CourseSchema } from "@/client"

const COURSE_STATUS_LABELS: Record<string, string> = {
  [CourseStatus.DRAFT]: "Черновик",
  [CourseStatus.UNDER_REVIEW]: "На модерации",
  [CourseStatus.PUBLISHED]: "Опубликован",
  [CourseStatus.REJECTED]: "Отклонён",
}

export function TeachingPage() {
  const navigate = useNavigate()
  
  // 1. Используем созданные курсы (бесконечная пагинация, фильтр "created")
  const {
    data: createdPages,
    isLoading: isLoadingCreatedCourses,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useCreatedCoursesPage()
  const [activeCourseId, setActiveCourseId] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [confirmDeleteCourseId, setConfirmDeleteCourseId] = useState<
    string | null
  >(null)

  const { deleteCourseAsync, isDeletingCourse } = useCourses()

  // 2. Плоский список из всех страниц
  const coursesList: CourseSchema[] = (createdPages?.pages ?? []).flat() as CourseSchema[]

  // Выбираем фокусный курс (выбранный вручную или первый в списке)
  const mainCourse = coursesList.find((c) => String(c.id) === String(activeCourseId)) || coursesList[0]

  const courseToDelete = coursesList.find(
    (c) => String(c.id) === String(confirmDeleteCourseId),
  )

  const handleDeleteCourse = async () => {
    if (!confirmDeleteCourseId) return
    try {
      await deleteCourseAsync({
        path: { course_id: confirmDeleteCourseId },
      })
      if (String(activeCourseId) === confirmDeleteCourseId) {
        setActiveCourseId(null)
      }
      setConfirmDeleteCourseId(null)
    } catch {
      // Ошибка уже обработана в onError мутации (showErrorToast)
    }
  }

  if (isLoadingCreatedCourses) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-xs text-muted-foreground font-medium">Загрузка студии преподавателя...</p>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 py-6 px-4 sm:px-6">
      
      {/* 1. ХЭДЕР: Название + Сквозные Метрики */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary text-[10px] font-bold tracking-wider uppercase">
              Студия преподавателя
            </span>
            <span className="text-muted-foreground text-xs">• Workspace</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-foreground mt-1">
            Управление контентом
          </h1>
        </div>

        {/* Метрики */}
        <div className="flex items-center gap-3 sm:gap-6 bg-card rounded-xl p-2.5 px-4 shadow-[var(--shadow-card)]">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-md bg-success/10 text-success">
              <DollarSign className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Баланс</p>
              <p className="text-xs font-bold font-mono text-foreground">0 ₽</p>
            </div>
          </div>

          <div className="h-6 w-[1px] bg-border/60" />

          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-md bg-primary/10 text-primary">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Курсов</p>
              <p className="text-xs font-bold font-mono text-foreground">{coursesList.length}</p>
            </div>
          </div>

          <div className="h-6 w-[1px] bg-border/60" />

          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-md bg-reward/10 text-reward">
              <Star className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Рейтинг</p>
              <p className="text-xs font-bold font-mono text-foreground">5.0</p>
            </div>
          </div>
        </div>
      </div>

      {/* РЕЖИМ СОЗДАНИЯ КУРСА */}
      {isCreating ? (
        <div className="max-w-2xl mx-auto py-4">
          <CreateCourseForm 
            onCancel={() => setIsCreating(false)} 
          />
        </div>
      ) : coursesList.length === 0 ? (
        /* Состояние: Курсы ещё не созданы */
        <div className="flex flex-col items-center justify-center p-12 text-center rounded-xl bg-card/50 space-y-4">
          <div className="p-4 rounded-md bg-primary/10 text-primary">
            <BookOpen className="w-8 h-8" />
          </div>
          <div className="max-w-md space-y-1">
            <h3 className="text-lg font-bold text-foreground">У вас пока нет созданных курсов</h3>
            <p className="text-xs text-muted-foreground">
              Начните с нуля или воспользуйтесь AI Copilot для генерации структуры вашего первого обучающего модуля.
            </p>
          </div>
          <Button
            onClick={() => setIsCreating(true)}
            className="shadow-[var(--shadow-glow-primary)] active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Создать первый курс</span>
          </Button>
          <Link
            to={ROUTES.TEACHING_GUIDE}
            className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline transition-colors"
          >
            Узнать, как создавать курсы
          </Link>
        </div>
      ) : (
        <>
          {/* 2. HERO WORKSTATION: Активный курс */}
          {mainCourse && (
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-card via-card to-primary/5 p-6 sm:p-8 shadow-[var(--shadow-glow-primary)]">
              <div className="absolute -top-24 -right-24 w-80 h-80 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-32 -left-20 w-72 h-72 bg-reward/5 rounded-full blur-3xl pointer-events-none" />

              <div className="flex flex-col lg:flex-row gap-6 lg:items-center justify-between relative z-10">
                <div className="space-y-4 max-w-2xl">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-success/10 text-success">
                      <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                      Активный выбор • Live
                    </span>
                  </div>

                  <div>
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight mt-1">
                      {mainCourse.title}
                    </h2>
                    {mainCourse.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-2 leading-relaxed">
                        {mainCourse.description}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2 max-w-md">
                    <div className="bg-background/40 backdrop-blur-md rounded-md p-3">
                      <span className="text-[10px] text-muted-foreground block">Студентов</span>
                      <span className="text-xs font-bold text-foreground block">
                        {mainCourse.member_count ?? 0}
                      </span>
                    </div>
                    <div className="bg-background/40 backdrop-blur-md rounded-md p-3">
                      <span className="text-[10px] text-muted-foreground block">Статус</span>
                      <span className="text-xs font-bold text-foreground block">
                        {COURSE_STATUS_LABELS[mainCourse.status] ?? mainCourse.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Действия с выбранным курсом */}
                <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 shrink-0 justify-center">
                  <Button
                    onClick={() => {
                      navigate({
                        to: `${ROUTES.TEACHING_COURSE}/$courseId`,
                        params: { courseId: String(mainCourse.id) },
                      })
                    }}
                    className="shadow-[var(--shadow-glow-primary)] active:scale-95"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>Открыть конструктор уроков</span>
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => {
                      navigate({
                        to: `${ROUTES.TEACHING_COURSE}/$courseId/analytics`,
                        params: { courseId: String(mainCourse.id) },
                      })
                    }}
                  >
                    <BarChart2 className="w-4 h-4 text-primary" />
                    <span>Аналитика и отзывы</span>
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* 3. ДВУХКОЛОНОЧНЫЙ МАКЕТ: Список курсов + AI Copilot */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-2">
            
            {/* Список программ */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-primary" />
                  <h3 className="font-bold text-base text-foreground">
                    Мои программы ({coursesList.length})
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={() => setIsCreating(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-semibold rounded-full transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Создать курс</span>
                </button>
              </div>

              <div className="divide-y divide-border/40 rounded-xl bg-card overflow-hidden shadow-[var(--shadow-card)]">
                {coursesList.map((course) => {
                  const isSelected = mainCourse?.id === course.id
                  return (
                    <div
                      key={course.id}
                      onClick={() => setActiveCourseId(String(course.id))}
                      className={`p-4 flex items-center justify-between gap-4 cursor-pointer transition-colors group ${
                        isSelected ? "bg-primary/5" : "hover:bg-muted/30"
                      }`}
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-10 h-10 rounded-md overflow-hidden bg-primary/10 flex items-center justify-center text-primary shrink-0">
                          {course.cover_url ? (
                            <img
                              src={resolveMediaUrl(course.cover_url)}
                              alt={course.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <BookOpen className="w-4 h-4" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-semibold text-sm text-foreground truncate group-hover:text-primary transition-colors">
                            {course.title}
                          </h4>
                          <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                            {course.description || "Без описания"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 shrink-0">
                        <span
                          className={`hidden sm:inline-flex px-2 py-0.5 rounded text-[10px] font-medium ${
                            course.status === CourseStatus.PUBLISHED
                              ? "bg-success/10 text-success"
                              : course.status === CourseStatus.UNDER_REVIEW
                                ? "bg-reward/10 text-reward"
                                : course.status === CourseStatus.REJECTED
                                  ? "bg-destructive/10 text-destructive"
                                  : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {COURSE_STATUS_LABELS[course.status] ?? course.status}
                        </span>

                        <button
                          type="button"
                          aria-label="Удалить курс"
                          onClick={(e) => {
                            e.stopPropagation()
                            setConfirmDeleteCourseId(String(course.id))
                          }}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>

              {hasNextPage && (
                <Button
                  variant="ghost"
                  className="w-full text-xs text-muted-foreground"
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                >
                  {isFetchingNextPage ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                      Загрузка...
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-3.5 h-3.5 mr-1" />
                      Показать ещё
                    </>
                  )}
                </Button>
              )}
            </div>

            {/* AI Copilot */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Sparkle className="w-4 h-4 text-reward" />
                <h3 className="font-bold text-base text-foreground">AI Copilot для преподавателя</h3>
              </div>

              <CourseGenerateCard />

              <div className="p-4 rounded-xl bg-muted/20 text-xs text-muted-foreground space-y-2">
                <p className="font-semibold text-foreground">💡 Совет для конверсии</p>
                <p>
                  Курсы с видео-презентацией получают на{" "}
                  <span className="text-primary font-bold">+35% больше</span> студентов.
                  Загрузите видео на YouTube, VK Видео или RuTube и просто вставьте ссылку в
                  конструктор!
                </p>
              </div>
            </div>

          </div>
        </>
      )}

      <ConfirmDialog
        open={confirmDeleteCourseId !== null}
        onOpenChange={(open) => {
          if (!open) setConfirmDeleteCourseId(null)
        }}
        title={
          courseToDelete
            ? `Удалить курс «${courseToDelete.title}»?`
            : "Удалить курс?"
        }
        description={
          <ul className="list-disc pl-5 space-y-1.5 text-sm">
            <li>
              Курс станет недоступен студентам и исчезнет из каталога и студии
              преподавателя.
            </li>
            <li>
              Все записавшиеся студенты получат уведомление об удалении курса.
            </li>
            <li>
              Модули, уроки, материалы и прогресс по курсу также станут
              недоступны.
            </li>
            <li>
              Удаление возможно, только если на курсе нет студентов и
              результатов обучения.
            </li>
            <li className="font-medium text-destructive">
              Действие необратимо — восстановить курс будет нельзя.
            </li>
          </ul>
        }
        confirmLabel="Удалить курс"
        destructive
        isConfirming={isDeletingCourse}
        onConfirm={handleDeleteCourse}
      />

    </div>
  )
}