import { useEffect, useState } from "react";
import { Loader2, X } from "lucide-react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { useCourseCatalog } from "@/features/dashboard/api/useCourses";
import { useCategoryBySlug } from "@/features/dashboard/api/useCategories";
import { CourseCard } from "@/features/dashboard/components/CourseCard";
import { CourseFilters } from "@/features/dashboard/components/CourseFilters";
import type { CourseCardData } from "@/features/dashboard/types";

const PAGE_SIZE = 12;

export function CatalogPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/_layout/catalog" });
  const categorySlug = search.category;
  const query = search.q;
  const activeCategory = useCategoryBySlug(categorySlug);
  const [freeOnly, setFreeOnly] = useState(false);

  const {
    data,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
  } = useCourseCatalog(PAGE_SIZE, categorySlug, query);

  const courses = (data?.pages.flat() ?? []) as CourseCardData[];
  const visibleCourses = freeOnly
    ? courses.filter((course) => course.price === 0)
    : courses;

  useEffect(() => {
    const sentinel = document.getElementById("catalog-sentinel");
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: "300px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const clearCategory = () => {
    navigate({ to: "/catalog", search: query ? { q: query } : {} });
  };

  const clearQuery = () => {
    navigate({ to: "/catalog", search: categorySlug ? { category: categorySlug } : {} });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 py-2 px-4 sm:px-6">
      <div className="pb-4 space-y-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {activeCategory
              ? activeCategory.name
              : query
                ? "Поиск курсов"
                : "Каталог курсов"}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {activeCategory
              ? query
                ? `Результаты по запросу «${query}» в категории «${activeCategory.name}»`
                : "Курсы выбранной категории"
              : query
                ? `Результаты по запросу «${query}»`
                : "Все опубликованные курсы платформы"}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <CourseFilters freeOnly={freeOnly} onFreeOnlyChange={setFreeOnly} />
          {query && (
            <button
              type="button"
              onClick={clearQuery}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
            >
              {query}
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          {activeCategory && (
            <button
              type="button"
              onClick={clearCategory}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
            >
              {activeCategory.name}
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : visibleCourses.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground text-sm">
          {freeOnly
            ? "Бесплатных курсов в этой категории пока нет."
            : query
              ? "По вашему запросу ничего не найдено."
              : "Курсы пока не найдены."}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {visibleCourses.map((course) => (
            <CourseCard key={course.id} course={course} alwaysOpenDetail />
          ))}
        </div>
      )}

      <div id="catalog-sentinel" className="h-10" />
      {isFetchingNextPage && (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
        </div>
      )}
      {!hasNextPage && !isLoading && courses.length > 0 && (
        <p className="text-center text-xs text-muted-foreground py-2">Конец списка</p>
      )}
    </div>
  );
}
