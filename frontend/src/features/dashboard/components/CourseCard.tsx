import { Card } from "@/components/ui/card";
import { BookOpen, ChevronRight, Users } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { resolveMediaUrl } from "@/lib/media";
import { CourseStatus } from "@/client";
import { ROUTES } from "@/routes";
import type { CourseCardData } from "@/features/dashboard/types";

interface CourseCardProps {
  course: CourseCardData;
  className?: string;
  onClick?: (course: CourseCardData) => void;
}

function DetailsButton({ course }: { course: CourseCardData }) {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        navigate({
          to: `${ROUTES.COURSE_DETAIL}/$courseId`,
          params: { courseId: course.id },
        });
      }}
      className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition-colors shadow-xs"
    >
      Подробнее
      <ChevronRight className="w-3.5 h-3.5" />
    </button>
  );
}

export function CourseCard({ course, className, onClick }: CourseCardProps) {
  const navigate = useNavigate();
  const cover = resolveMediaUrl(course.cover_url);
  const showProgress = course.progress !== undefined;
  const isDraft = course.status === CourseStatus.DRAFT;
  const memberCount = course.member_count ?? 0;

  const handleCardClick = () => {
    onClick?.(course);
    if (course.is_member) {
      navigate({
        to: "/learn/$courseId",
        params: { courseId: course.id },
      });
      return;
    }
    navigate({
      to: `${ROUTES.COURSE_DETAIL}/$courseId`,
      params: { courseId: course.id },
    });
  };

  return (
    <Card
      onClick={handleCardClick}
      className={cn(
        "group relative border-border/50 bg-card rounded-2xl p-4 w-full flex flex-col justify-between h-52 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer overflow-hidden",
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

      {/* Нижняя часть: цена + участники, затем прогресс / статус / подробнее */}
      <div className="pt-2 border-t border-border/30 mt-auto space-y-2">
        {!isDraft && (
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            {course.price === 0 ? (
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                Бесплатно
              </span>
            ) : (
              <span className="font-bold text-red-500 dark:text-red-400">
                {course.price.toLocaleString()} ₽
              </span>
            )}
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              {memberCount} участников
            </span>
          </div>
        )}

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
        ) : isDraft ? (
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Статус:</span>
            <span className="text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-md font-semibold text-[10px]">
              Черновик
            </span>
          </div>
        ) : (
          <DetailsButton course={course} />
        )}
      </div>
    </Card>
  );
}
