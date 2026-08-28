import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import { ArrowRight, BookOpen, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { resolveMediaUrl } from "@/lib/media";
import { Button } from "@/components/ui/button";
import { CourseCard } from "@/features/dashboard/components/CourseCard";
import type { CourseCardData } from "@/features/dashboard/types";

interface ContinueLearningSectionProps {
  title: string;
  icon?: LucideIcon;
  accentClassName?: string;
  count?: number;
  courses: CourseCardData[];
  filters?: ReactNode;
  className?: string;
  onCourseClick?: (course: CourseCardData) => void;
  rowActionLabel?: string;
  rowActionIcon?: LucideIcon;
  showProgress?: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoadingMore?: boolean;
}

const FEATURED_LIMIT = 2;
const VISIBLE_REST_LIMIT = 4;

export function ContinueLearningSection({
  title,
  icon: Icon = BookOpen,
  accentClassName,
  count,
  courses,
  filters,
  className,
  onCourseClick,
  rowActionLabel = "Продолжить",
  rowActionIcon: RowActionIcon = ArrowRight,
  showProgress = true,
  onLoadMore,
  hasMore = false,
  isLoadingMore = false,
}: ContinueLearningSectionProps) {
  const [showAll, setShowAll] = useState(false);
  const navigate = useNavigate();
  const usingLoadMore = Boolean(onLoadMore);
  const featured = courses.slice(0, FEATURED_LIMIT);
  const rest = courses.slice(FEATURED_LIMIT);
  const restVisible = usingLoadMore
    ? rest
    : showAll
      ? rest
      : rest.slice(0, VISIBLE_REST_LIMIT);
  const hiddenCount = usingLoadMore ? 0 : rest.length - VISIBLE_REST_LIMIT;

  const handleNavigate = (course: CourseCardData) => {
    if (onCourseClick) {
      onCourseClick(course);
      return;
    }
    navigate({
      to: "/learn/$courseId",
      params: { courseId: course.id },
    });
  };

  return (
    <section className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className={cn("w-5 h-5 text-primary", accentClassName)} />
          <h2 className="text-lg font-bold text-foreground">{title}</h2>
          {count !== undefined && (
            <span className="text-xs font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
              {count}
            </span>
          )}
        </div>
      </div>

      {filters && <div className="pt-1">{filters}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {featured.map((course) => (
          <CourseCard key={course.id} course={course} onClick={handleNavigate} />
        ))}
      </div>

      {rest.length > 0 && (
        <div className="space-y-2 pt-2 lg:max-w-[66.67%]">
          <div className="space-y-2">
            {restVisible.map((course) => (
              <div
                key={course.id}
                role="button"
                tabIndex={0}
                onClick={() => handleNavigate(course)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") handleNavigate(course);
                }}
                className="group flex items-center gap-3 bg-card rounded-xl shadow-[var(--shadow-card)] px-4 py-3 hover:shadow-glow-primary transition-all duration-200 cursor-pointer"
              >
                {course.cover_url ? (
                  <img
                    src={resolveMediaUrl(course.cover_url)}
                    alt={course.title}
                    className="w-10 h-10 rounded-md object-cover shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-md bg-muted/60 flex items-center justify-center text-muted-foreground shrink-0">
                    <BookOpen className="w-4 h-4" />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                    {course.title}
                  </p>
                  {showProgress && course.progress !== undefined && (
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-24 bg-muted rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-primary h-1.5 rounded-full transition-all duration-300"
                          style={{ width: `${course.progress}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-semibold text-primary tabular-nums">
                        {course.progress}%
                      </span>
                    </div>
                  )}
                </div>

                <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold transition-colors group-hover:bg-primary group-hover:text-white shrink-0">
                  {rowActionLabel}
                  <RowActionIcon className="w-3.5 h-3.5" />
                </span>
              </div>
            ))}
          </div>

          {usingLoadMore ? (
            hasMore && (
              <Button
                variant="ghost"
                className="w-full text-xs text-muted-foreground"
                onClick={() => onLoadMore?.()}
                disabled={isLoadingMore}
              >
                {isLoadingMore ? (
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
            )
          ) : (
            <>
              {!showAll && hiddenCount > 0 && (
                <Button
                  variant="ghost"
                  className="w-full text-xs text-muted-foreground"
                  onClick={() => setShowAll(true)}
                >
                  <ChevronDown className="w-3.5 h-3.5 mr-1" />
                  Показать ещё {hiddenCount} курс{hiddenCount % 10 === 1 && hiddenCount % 100 !== 11 ? "" : hiddenCount % 10 >= 2 && hiddenCount % 10 <= 4 && (hiddenCount % 100 < 12 || hiddenCount % 100 > 14) ? "а" : "ов"}
                </Button>
              )}
              {showAll && rest.length > VISIBLE_REST_LIMIT && (
                <Button
                  variant="ghost"
                  className="w-full text-xs text-muted-foreground"
                  onClick={() => setShowAll(false)}
                >
                  <ChevronUp className="w-3.5 h-3.5 mr-1" />
                  Свернуть
                </Button>
              )}
            </>
          )}
        </div>
      )}
    </section>
  );
}
