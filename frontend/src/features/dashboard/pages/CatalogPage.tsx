import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useCourseCatalog } from "@/features/dashboard/api/useCourses";
import { CourseCard } from "@/features/dashboard/components/CourseCard";
import { CourseFilters } from "@/features/dashboard/components/CourseFilters";
import type { CourseCardData } from "@/features/dashboard/types";

const PAGE_SIZE = 12;

export function CatalogPage() {
  const [freeOnly, setFreeOnly] = useState(false);

  const {
    data,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
  } = useCourseCatalog(PAGE_SIZE);

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

  return (
    <div className="max-w-7xl mx-auto space-y-6 py-2 px-4 sm:px-6">
      <div className="pb-4 space-y-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Каталог курсов
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Все опубликованные курсы платформы
          </p>
        </div>
        <CourseFilters freeOnly={freeOnly} onFreeOnlyChange={setFreeOnly} />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : visibleCourses.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground text-sm">
          {courses.length > 0
            ? "Бесплатных курсов пока нет."
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
