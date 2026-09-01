import { useEffect, useRef } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { CourseCard } from "@/features/dashboard/components/CourseCard";
import type { CourseCardData } from "@/features/dashboard/types";

interface RecommendedCoursesSectionProps {
  courses: CourseCardData[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
}

export function RecommendedCoursesSection({
  courses,
  isLoading,
  isLoadingMore,
  hasMore,
  onLoadMore,
}: RecommendedCoursesSectionProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasMore && !isLoadingMore) {
          onLoadMore();
        }
      },
      { rootMargin: "300px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, isLoadingMore, onLoadMore]);

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-reward" />
        <h2 className="text-lg font-bold text-foreground">Рекомендуемые</h2>
        <span className="text-xs font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
          {courses.length}
        </span>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : courses.length === 0 ? (
        <div className="text-center py-12 text-sm text-muted-foreground">
          Курсы пока не добавлены.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} alwaysOpenDetail />
          ))}
        </div>
      )}

      <div ref={sentinelRef} className="h-6" />
      {isLoadingMore && (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
        </div>
      )}
      {!hasMore && !isLoading && courses.length > 0 && (
        <p className="text-center text-xs text-muted-foreground py-2">Конец списка</p>
      )}
    </section>
  );
}
