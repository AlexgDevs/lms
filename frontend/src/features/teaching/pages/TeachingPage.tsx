import { useState } from "react"
import { 
  Plus, 
  Users, 
  DollarSign, 
  Star, 
  Edit3, 
  BarChart2, 
  Sparkles,
  Layers,
  ChevronRight,
  Sparkle,
  Loader2,
  BookOpen
} from "lucide-react"
import { useNavigate } from "@tanstack/react-router"
import { useCourses } from "@/features/teaching/api/useCourses"
import { CreateCourseForm } from "@/features/teaching/components/CreateCourseForm"
import { ROUTES } from "@/routes"
import type { CourseSchema } from "@/client"

export function TeachingPage() {
  const navigate = useNavigate()
  
  // 1. Используем созданные курсы (фильтр "created") из нашего хука
  const { createdCourses, isLoadingCreatedCourses } = useCourses()
  const [activeCourseId, setActiveCourseId] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  // 2. Достаем список курсов (normalized: ответ может быть массивом или объектом пагинации)
  const coursesList: CourseSchema[] = Array.isArray(createdCourses)
    ? (createdCourses as CourseSchema[])
    : []

  // Выбираем фокусный курс (выбранный вручную или первый в списке)
  const mainCourse = coursesList.find((c) => String(c.id) === String(activeCourseId)) || coursesList[0]

  if (isLoadingCreatedCourses) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
        <p className="text-xs text-muted-foreground font-medium">Загрузка авторской студии...</p>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 py-6 px-4 sm:px-6">
      
      {/* 1. ХЭДЕР: Название + Сквозные Метрики */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-border/40">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-400 text-[10px] font-bold tracking-wider uppercase">
              Авторская студия
            </span>
            <span className="text-muted-foreground text-xs">• Workspace</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-foreground mt-1">
            Управление контентом
          </h1>
        </div>

        {/* Метрики */}
        <div className="flex items-center gap-3 sm:gap-6 bg-card border border-border/60 rounded-2xl p-2.5 px-4 shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <DollarSign className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Баланс</p>
              <p className="text-xs font-bold font-mono text-foreground">0 ₽</p>
            </div>
          </div>

          <div className="h-6 w-[1px] bg-border/60" />

          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Курсов</p>
              <p className="text-xs font-bold font-mono text-foreground">{coursesList.length}</p>
            </div>
          </div>

          <div className="h-6 w-[1px] bg-border/60" />

          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
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
        <div className="flex flex-col items-center justify-center p-12 text-center rounded-3xl border border-dashed border-border/60 bg-card/50 space-y-4">
          <div className="p-4 rounded-2xl bg-purple-500/10 text-purple-400">
            <BookOpen className="w-8 h-8" />
          </div>
          <div className="max-w-md space-y-1">
            <h3 className="text-lg font-bold text-foreground">У вас пока нет созданных курсов</h3>
            <p className="text-xs text-muted-foreground">
              Начните с нуля или воспользуйтесь AI Copilot для генерации структуры вашего первого обучающего модуля.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs rounded-xl transition-all shadow-lg shadow-purple-600/20 active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Создать первый курс</span>
          </button>
        </div>
      ) : (
        <>
          {/* 2. HERO WORKSTATION: Активный курс */}
          {mainCourse && (
            <div className="relative overflow-hidden rounded-3xl border border-purple-500/20 bg-gradient-to-br from-card via-card to-purple-950/20 p-6 sm:p-8 shadow-xl">
              <div className="absolute -top-24 -right-24 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

              <div className="flex flex-col lg:flex-row gap-6 lg:items-center justify-between relative z-10">
                <div className="space-y-4 max-w-2xl">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Активный выбор • Live
                    </span>
                  </div>

                  <div>
                    <span className="text-xs font-bold text-purple-400 tracking-wider uppercase font-mono">
                      Курс ID: #{mainCourse.id}
                    </span>
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
                    <div className="bg-background/40 backdrop-blur-md rounded-xl p-3 border border-border/40">
                      <span className="text-[10px] text-muted-foreground block">Автор (Owner ID)</span>
                      <span className="text-xs font-bold text-foreground font-mono truncate block">
                        #{mainCourse.owner_id ?? "N/A"}
                      </span>
                    </div>
                    <div className="bg-background/40 backdrop-blur-md rounded-xl p-3 border border-border/40">
                      <span className="text-[10px] text-muted-foreground block">Статус</span>
                      <span className="text-xs font-bold text-emerald-400">Активен</span>
                    </div>
                  </div>
                </div>

                {/* Действия с выбранным курсом */}
                <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 shrink-0 justify-center">
                  <button
                    type="button"
                    onClick={() => {
                      navigate({
                        to: `${ROUTES.TEACHING_COURSE}/$courseId`,
                        params: { courseId: String(mainCourse.id) },
                      })
                    }}
                    className="flex items-center justify-center gap-2 px-5 py-3 bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-purple-600/25 transition-all active:scale-95 cursor-pointer"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>Открыть конструктор уроков</span>
                  </button>

                  <button
                    type="button"
                    className="flex items-center justify-center gap-2 px-5 py-2.5 bg-background/60 hover:bg-background border border-border/60 text-foreground text-xs font-medium rounded-xl transition-all"
                  >
                    <BarChart2 className="w-4 h-4 text-purple-400" />
                    <span>Аналитика и отзывы</span>
                  </button>
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
                  <Layers className="w-4 h-4 text-purple-400" />
                  <h3 className="font-bold text-base text-foreground">
                    Мои программы ({coursesList.length})
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={() => setIsCreating(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600/10 hover:bg-purple-600/20 text-purple-300 text-xs font-semibold rounded-xl transition-colors border border-purple-500/20 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Создать курс</span>
                </button>
              </div>

              <div className="divide-y divide-border/40 border border-border/50 rounded-2xl bg-card overflow-hidden">
                {coursesList.map((course) => {
                  const isSelected = mainCourse?.id === course.id
                  return (
                    <div
                      key={course.id}
                      onClick={() => setActiveCourseId(String(course.id))}
                      className={`p-4 flex items-center justify-between gap-4 cursor-pointer transition-colors group ${
                        isSelected ? "bg-purple-500/5" : "hover:bg-muted/30"
                      }`}
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0 font-bold text-xs font-mono">
                          #{String(course.id).slice(0, 4)}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-semibold text-sm text-foreground truncate group-hover:text-purple-400 transition-colors">
                            {course.title}
                          </h4>
                          <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                            {course.description || "Без описания"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 shrink-0">
                        <span className="hidden sm:inline-flex px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-400">
                          Опубликован
                        </span>

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
            </div>

            {/* AI Copilot */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Sparkle className="w-4 h-4 text-amber-400" />
                <h3 className="font-bold text-base text-foreground">AI Copilot для автора</h3>
              </div>

              <div className="p-5 rounded-2xl bg-card border border-border/60 space-y-4">
                <div className="space-y-1">
                  <h4 className="font-semibold text-sm text-foreground flex items-center gap-2">
                    Сгенерировать программу
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Введите тему курса, и ИИ создаст структуру разделов, уроков и тестов за несколько секунд.
                  </p>
                </div>

                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Например: Продвинутый Kubernetes..."
                    className="w-full bg-background border border-border/60 rounded-xl px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-purple-500 transition-colors"
                  />
                  <button
                    type="button"
                    className="w-full py-2 px-3 bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Создать структуру</span>
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-2xl border border-border/40 bg-muted/20 text-xs text-muted-foreground space-y-2">
                <p className="font-semibold text-foreground">💡 Совет для конверсии</p>
                <p>
                  Курсы с короткой видео-презентацией (до 2 минут) получают на <span className="text-purple-400 font-bold">+35% больше</span> записавшихся студентов.
                </p>
              </div>
            </div>

          </div>
        </>
      )}

    </div>
  )
}