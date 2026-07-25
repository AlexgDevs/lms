import { useState } from "react";
import { CourseCard, type Course } from "@/components/dashboard/CourseCard";
import { BookOpen, PlusCircle, Sparkles, ArrowRight, Globe } from "lucide-react";

// --- MOCK ДАННЫЕ ---
const MY_COURSES_MOCK: Course[] = [
  {
    id: 101,
    title: "AI Агенты на Python: для начинающих",
    category: "AI & Python",
    coverUrl: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=150&auto=format&fit=crop&q=60",
    author: "Станислав Попов",
    rating: 5.0,
    durationHours: 27,
    progress: 68,
    isFavorite: true,
  },
  {
    id: 102,
    title: "React 19 & Next.js 15: Продвинутая Архитектура",
    category: "Frontend",
    coverUrl: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=150&auto=format&fit=crop&q=60",
    author: "Евгений Ковалев",
    rating: 4.9,
    durationHours: 42,
    progress: 24,
  },
  {
    id: 103,
    title: "PostgreSQL для Backend Разработчиков",
    category: "Базы Данных",
    coverUrl: "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=150&auto=format&fit=crop&q=60",
    author: "Алексей Смирнов",
    rating: 4.8,
    durationHours: 18,
    progress: 90,
  },
];

const CREATED_COURSES_MOCK: Course[] = [
  {
    id: 201,
    title: "FastAPI + Clean Architecture: Полное руководство",
    category: "Backend",
    coverUrl: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=150&auto=format&fit=crop&q=60",
    author: "Вы (Автор)",
    studentsCount: 340,
    rating: 4.95,
    status: "published",
  },
  {
    id: 202,
    title: "Микросервисы на Go и Kafka",
    category: "DevOps / Go",
    coverUrl: "https://images.unsplash.com/photo-1607799279861-4dd421887fb3?w=150&auto=format&fit=crop&q=60",
    author: "Вы (Автор)",
    status: "review",
  },
  {
    id: 203,
    title: "Промпт-инжиниринг и интеграция LLM в SaaS",
    category: "AI & ML",
    coverUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=60",
    author: "Вы (Автор)",
    status: "draft",
  },
];

const RECOMMENDED_COURSES_MOCK: Course[] = [
  {
    id: 301,
    title: "Docker, Kubernetes и CI/CD с нуля",
    category: "DevOps",
    coverUrl: "https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?w=150&auto=format&fit=crop&q=60",
    author: "Иван Громов",
    rating: 4.85,
    studentsCount: 1420,
    durationHours: 35,
    hasCertificate: true,
    price: 3200,
    oldPrice: 4500,
    discountBadge: "-28%",
  },
  {
    id: 302,
    title: "Основы TypeScript для React разработчиков",
    category: "Frontend",
    coverUrl: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=150&auto=format&fit=crop&q=60",
    author: "Plectix Education",
    rating: 4.9,
    studentsCount: 3100,
    durationHours: 12,
    hasCertificate: true,
    price: 0,
  },
  {
    id: 303,
    title: "Системный дизайн (System Design) на практике",
    category: "Architecture",
    coverUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=150&auto=format&fit=crop&q=60",
    author: "Дмитрий Черепанов",
    rating: 5.0,
    studentsCount: 890,
    durationHours: 50,
    hasCertificate: true,
    price: 5900,
    oldPrice: 7500,
    discountBadge: "-21%",
  },
  {
    id: 304,
    title: "Fullstack разработка на Next.js + Prisma + Tailwind",
    category: "Fullstack",
    coverUrl: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=150&auto=format&fit=crop&q=60",
    author: "Анна Мельникова",
    rating: 4.75,
    studentsCount: 650,
    durationHours: 29,
    hasCertificate: true,
    price: 2490,
    oldPrice: 3500,
    discountBadge: "-28%",
  },
];

export function RootPage() {
  const [recommendations, setRecommendations] = useState<Course[]>(RECOMMENDED_COURSES_MOCK);

  // Состояния для фильтров
  const [filterPrice, setFilterPrice] = useState<"all" | "free" | "paid">("all");
  const [onlyRu, setOnlyRu] = useState(false);
  const [isAiGenerated, setIsAiGenerated] = useState(false);

  const handleToggleFavorite = (id: number) => {
    setRecommendations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isFavorite: !c.isFavorite } : c))
    );
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 py-6 px-4 sm:px-6">
      
      {/* ХЕДЕР С ФИЛЬТРАМИ (БЕЗ ВНЕШНИХ КОМПОНЕНТОВ BUTTON) */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-border/40">
        
        {/* Заголовок */}
        <div className="shrink-0">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Актуальные курсы
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            С возвращением! У вас 3 активных курса в процессе изучения.
          </p>
        </div>

        {/* ФИЛЬТРЫ */}
        <div className="flex flex-wrap items-center gap-2 my-auto">
          
          {/* 1. Переключатель: Все / Бесплатные / Платные */}
          <div className="flex items-center bg-muted/60 p-0.5 rounded-xl border border-border/50 text-xs font-medium">
            <button
              type="button"
              onClick={() => setFilterPrice("all")}
              className={`px-3 py-1 rounded-lg transition-all ${
                filterPrice === "all"
                  ? "bg-background text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Все
            </button>
            <button
              type="button"
              onClick={() => setFilterPrice("free")}
              className={`px-3 py-1 rounded-lg transition-all ${
                filterPrice === "free"
                  ? "bg-background text-emerald-500 shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Бесплатные
            </button>
            <button
              type="button"
              onClick={() => setFilterPrice("paid")}
              className={`px-3 py-1 rounded-lg transition-all ${
                filterPrice === "paid"
                  ? "bg-background text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Платные
            </button>
          </div>

          <div className="h-4 w-[1px] bg-border/60 hidden sm:block mx-0.5" />

          {/* 2. Чипса: На русском */}
          <button
            type="button"
            onClick={() => setOnlyRu(!onlyRu)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-medium border transition-all ${
              onlyRu
                ? "bg-purple-500/10 border-purple-500/40 text-purple-400"
                : "bg-muted/30 border-border/50 text-muted-foreground hover:text-foreground hover:bg-muted/60"
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Только RU</span>
          </button>

          {/* 3. Чипса: ИИ / Сгенерировано */}
          <button
            type="button"
            onClick={() => setIsAiGenerated(!isAiGenerated)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-medium border transition-all ${
              isAiGenerated
                ? "bg-amber-500/10 border-amber-500/40 text-amber-400"
                : "bg-muted/30 border-border/50 text-muted-foreground hover:text-foreground hover:bg-muted/60"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Сгенерировано ИИ</span>
          </button>
        </div>

        {/* Простые действия справа */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            className="px-3 py-1.5 text-xs font-medium rounded-xl border border-border/60 bg-transparent text-foreground hover:bg-muted/50 transition-colors"
          >
            Каталог
          </button>
          <button
            type="button"
            className="px-3 py-1.5 text-xs font-medium rounded-xl bg-purple-600 hover:bg-purple-500 text-white transition-colors shadow-xs"
          >
            Продолжить
          </button>
        </div>

      </div>

      {/* 1. СЕКЦИЯ: МОИ КУРСЫ */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-purple-600" />
            <h2 className="text-lg font-bold text-foreground">Мои курсы</h2>
            <span className="text-xs font-semibold bg-purple-500/10 text-purple-600 px-2 py-0.5 rounded-full">
              {MY_COURSES_MOCK.length}
            </span>
          </div>
          <button
            type="button"
            className="flex items-center text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Все мои курсы <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {MY_COURSES_MOCK.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      </section>

      {/* 2. СЕКЦИЯ: СОЗДАВАЕМЫЕ КУРСЫ */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-purple-600" />
            <h2 className="text-lg font-bold text-foreground">Преподавание и разработка</h2>
          </div>
          <button
            type="button"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium rounded-xl transition-colors"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Создать курс</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {CREATED_COURSES_MOCK.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      </section>

      {/* 3. СЕКЦИЯ: РЕКОМЕНДАЦИИ */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg font-bold text-foreground">Рекомендуемые курсы</h2>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {recommendations.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              onToggleFavorite={handleToggleFavorite}
            />
          ))}
        </div>
      </section>

    </div>
  );
}