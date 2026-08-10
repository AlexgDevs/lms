import { useState } from "react";
import { CourseCard } from "@/features/dashboard/components/CourseCard";
import { CatalogFilters, type PriceFilter } from "@/features/dashboard/components/CatalogFilters";
import type { Course } from "@/features/dashboard/types";
import {
    MY_COURSES_MOCK,
    CREATED_COURSES_MOCK,
    RECOMMENDED_COURSES_MOCK,
} from "@/features/dashboard/data/mocks";
import { BookOpen, PlusCircle, Sparkles, ArrowRight } from "lucide-react";

export function RootPage() {
    const [recommendations, setRecommendations] = useState<Course[]>(RECOMMENDED_COURSES_MOCK);

    // Состояния для фильтров
    const [filterPrice, setFilterPrice] = useState<PriceFilter>("all");
    const [onlyRu, setOnlyRu] = useState(false);
    const [isAiGenerated, setIsAiGenerated] = useState(false);

    const handleToggleFavorite = (id: number) => {
        setRecommendations((prev) =>
            prev.map((c) => (c.id === id ? { ...c, isFavorite: !c.isFavorite } : c))
        );
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 py-6 px-4 sm:px-6">

            {/* ХЕДЕР С ФИЛЬТРАМИ */}
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
                <CatalogFilters
                    filterPrice={filterPrice}
                    onFilterPriceChange={setFilterPrice}
                    onlyRu={onlyRu}
                    onOnlyRuChange={setOnlyRu}
                    isAiGenerated={isAiGenerated}
                    onAiGeneratedChange={setIsAiGenerated}
                />

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
