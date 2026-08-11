import { Card } from "@/components/ui/card";
import { BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { resolveMediaUrl } from "@/lib/media";
import { CourseStatus } from "@/client";
import type { CourseCardData } from "@/features/dashboard/types";

interface CourseCardProps {
  course: CourseCardData;
  className?: string;
  onClick?: (course: CourseCardData) => void;
}

export function CourseCard({ course, className, onClick }: CourseCardProps) {
  const cover = resolveMediaUrl(course.cover_url);
  const showProgress = course.progress !== undefined;

  return (
    <Card
      onClick={() => onClick?.(course)}
      className={cn(
        "group relative border-border/50 bg-card rounded-2xl p-4 w-full flex flex-col justify-between h-48 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer overflow-hidden",
        className
      )}
    >
      {/* Верхняя часть: обложка + заголовок */}
      <div className="flex items-start gap-3 min-w-0">
        {cover ? (
          <img
            src={cover}
            alt={course.title}
            className="w-16 h-16 rounded-xl object-cover border border-border/40 shadow-xs shrink-0"
          />
        ) : (
          <div className="w-16 h-16 rounded-xl bg-muted/60 border border-border/40 flex items-center justify-center text-muted-foreground shrink-0">
            <BookOpen className="w-6 h-6" />
          </div>
        )}
        <div className="flex flex-col gap-1 min-w-0">
          <h3 className="font-bold text-sm sm:text-base text-foreground leading-snug line-clamp-2 group-hover:text-purple-600 transition-colors">
            {course.title}
          </h3>
          {course.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
              {course.description}
            </p>
          )}
        </div>
      </div>

      {/* Нижняя часть: прогресс / статус / цена */}
      <div className="pt-2 border-t border-border/30 mt-auto">
        {showProgress ? (
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] font-medium">
              <span className="text-muted-foreground">Прогресс</span>
              <span className="text-purple-600 font-bold">{course.progress}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-purple-600 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${course.progress}%` }}
              />
            </div>
          </div>
        ) : course.status === CourseStatus.DRAFT ? (
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Статус:</span>
            <span className="text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-md font-semibold text-[10px]">
              Черновик
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            {course.price === 0 ? (
              <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">
                Бесплатно
              </span>
            ) : (
              <span className="text-base font-extrabold text-red-500 dark:text-red-400">
                {course.price.toLocaleString()} ₽
              </span>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
