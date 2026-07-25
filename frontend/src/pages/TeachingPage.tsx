import { useState } from "react";
import { 
  Plus, 
  Users, 
  DollarSign, 
  Star, 
  BookOpen, 
  Edit3, 
  BarChart2, 
  Sparkles,
  ArrowUpRight,
  MoreHorizontal,
  Play,
  Layers,
  ChevronRight,
  Sparkle
} from "lucide-react";

export interface AuthorCourse {
  id: number;
  title: string;
  category: string;
  coverUrl: string;
  status: "published" | "draft" | "review";
  studentsCount: number;
  rating?: number;
  revenue?: number;
  lessonsCount: number;
  completionRate?: number;
  updatedAt: string;
  isMain?: boolean; // Флаг фокусного курса
}

const AUTHOR_COURSES_MOCK: AuthorCourse[] = [
  {
    id: 201,
    title: "FastAPI + Clean Architecture: Полное руководство",
    category: "Backend Development",
    coverUrl: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&auto=format&fit=crop&q=80",
    status: "published",
    studentsCount: 340,
    rating: 4.95,
    revenue: 425000,
    lessonsCount: 32,
    updatedAt: "2 часа назад",
    isMain: true,
  },
  {
    id: 202,
    title: "Микросервисы на Go и Kafka",
    category: "DevOps / Go",
    coverUrl: "https://images.unsplash.com/photo-1607799279861-4dd421887fb3?w=200&auto=format&fit=crop&q=60",
    status: "review",
    studentsCount: 0,
    lessonsCount: 18,
    completionRate: 100,
    updatedAt: "Вчера",
  },
  {
    id: 203,
    title: "Промпт-инжиниринг и интеграция LLM в SaaS",
    category: "AI & Machine Learning",
    coverUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=60",
    status: "draft",
    studentsCount: 0,
    lessonsCount: 8,
    completionRate: 45,
    updatedAt: "3 дня назад",
  },
];

export function TeachingPage() {
  const [courses] = useState<AuthorCourse[]>(AUTHOR_COURSES_MOCK);
  
  // Активный (фокусный) курс
  const mainCourse = courses.find((c) => c.isMain) || courses[0];
  // Остальные курсы
  const secondaryCourses = courses.filter((c) => c.id !== mainCourse.id);

  return (
    <div className="max-w-7xl mx-auto space-y-8 py-6 px-4 sm:px-6">
      
      {/* 1. ХЭДЕР НОВОГО ФОРМАТА: Название + Компактные Сквозные Метрики */}
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

        {/* Метрики в стиле "StatusBar" вместо классических 4 карточек */}
        <div className="flex items-center gap-3 sm:gap-6 bg-card border border-border/60 rounded-2xl p-2.5 px-4 shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <DollarSign className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Баланс</p>
              <p className="text-xs font-bold font-mono text-foreground">425 000 ₽</p>
            </div>
          </div>

          <div className="h-6 w-[1px] bg-border/60" />

          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Студенты</p>
              <p className="text-xs font-bold font-mono text-foreground">340 чел.</p>
            </div>
          </div>

          <div className="h-6 w-[1px] bg-border/60" />

          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
              <Star className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Рейтинг</p>
              <p className="text-xs font-bold font-mono text-foreground">4.95</p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. РАБОЧАЯ ОБЛАСТЬ (HERO WORKSTATION): Главный активный курс */}
      {mainCourse && (
        <div className="relative overflow-hidden rounded-3xl border border-purple-500/20 bg-gradient-to-br from-card via-card to-purple-950/20 p-6 sm:p-8 shadow-xl">
          {/* Декоративный свечение-фон */}
          <div className="absolute -top-24 -right-24 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col lg:flex-row gap-6 lg:items-center justify-between relative z-10">
            
            {/* Левая часть: Инфо о курсе */}
            <div className="space-y-4 max-w-2xl">
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Активный курс • Live
                </span>
                <span className="text-xs text-muted-foreground font-medium">
                  Обновлено {mainCourse.updatedAt}
                </span>
              </div>

              <div>
                <span className="text-xs font-bold text-purple-400 tracking-wider uppercase">
                  {mainCourse.category}
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight mt-1">
                  {mainCourse.title}
                </h2>
              </div>

              {/* Мини-панель прогресса/статистики внутри курсового баннера */}
              <div className="grid grid-cols-3 gap-4 pt-2 max-w-md">
                <div className="bg-background/40 backdrop-blur-md rounded-xl p-3 border border-border/40">
                  <span className="text-[10px] text-muted-foreground block">Уроков готово</span>
                  <span className="text-sm font-bold text-foreground font-mono">{mainCourse.lessonsCount} модулей</span>
                </div>
                <div className="bg-background/40 backdrop-blur-md rounded-xl p-3 border border-border/40">
                  <span className="text-[10px] text-muted-foreground block">Учеников</span>
                  <span className="text-sm font-bold text-foreground font-mono">{mainCourse.studentsCount}</span>
                </div>
                <div className="bg-background/40 backdrop-blur-md rounded-xl p-3 border border-border/40">
                  <span className="text-[10px] text-muted-foreground block">Выручка</span>
                  <span className="text-sm font-bold text-purple-300 font-mono">{(mainCourse.revenue || 0).toLocaleString()} ₽</span>
                </div>
              </div>
            </div>

            {/* Правая часть: Управление главным курсом */}
            <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 shrink-0 justify-center">
              <button
                type="button"
                className="flex items-center justify-center gap-2 px-5 py-3 bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-purple-600/25 transition-all active:scale-95"
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

      {/* 3. ДВУХКОЛОНОЧНЫЙ МАКЕТ: Остальные курсы + Быстрый ИИ-инструментарий */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-2">
        
        {/* Левая колонка (2/3): Список всех остальных курсов в формате "Linear Table/List" */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-400" />
              <h3 className="font-bold text-base text-foreground">Все программы ({courses.length})</h3>
            </div>

            <button
              type="button"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600/10 hover:bg-purple-600/20 text-purple-300 text-xs font-semibold rounded-xl transition-colors border border-purple-500/20"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Создать курс</span>
            </button>
          </div>

          {/* Табличный / Списочный вид вместо карточек */}
          <div className="divide-y divide-border/40 border border-border/50 rounded-2xl bg-card overflow-hidden">
            {courses.map((course) => (
              <div
                key={course.id}
                className="p-4 flex items-center justify-between gap-4 hover:bg-muted/30 transition-colors group"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <img
                    src={course.coverUrl}
                    alt={course.title}
                    className="w-10 h-10 rounded-lg object-cover border border-border/50 shrink-0"
                  />
                  <div className="min-w-0">
                    <h4 className="font-semibold text-sm text-foreground truncate group-hover:text-purple-400 transition-colors">
                      {course.title}
                    </h4>
                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-0.5">
                      <span>{course.category}</span>
                      <span>•</span>
                      <span>{course.lessonsCount} уроков</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  {/* Статус */}
                  {course.status === "published" && (
                    <span className="hidden sm:inline-flex px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-400">
                      Опубликован
                    </span>
                  )}
                  {course.status === "review" && (
                    <span className="hidden sm:inline-flex px-2 py-0.5 rounded text-[10px] font-medium bg-blue-500/10 text-blue-400">
                      На проверке
                    </span>
                  )}
                  {course.status === "draft" && (
                    <span className="hidden sm:inline-flex px-2 py-0.5 rounded text-[10px] font-medium bg-amber-500/10 text-amber-400">
                      Черновик ({course.completionRate}%)
                    </span>
                  )}

                  {/* Кнопка настройки */}
                  <button
                    type="button"
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Правая колонка (1/3): ИИ-Студия и Креаторские Инструменты */}
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
                className="w-full py-2 px-3 bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Создать структуру</span>
              </button>
            </div>
          </div>

          {/* Виджет быстрой справки */}
          <div className="p-4 rounded-2xl border border-border/40 bg-muted/20 text-xs text-muted-foreground space-y-2">
            <p className="font-semibold text-foreground">💡 Совет для конверсии</p>
            <p>
              Курсы с короткой видео-презентацией (до 2 минут) получают на <span className="text-purple-400 font-bold">+35% больше</span> записавшихся студентов.
            </p>
          </div>
        </div>

      </div>

    </div>
  );
}