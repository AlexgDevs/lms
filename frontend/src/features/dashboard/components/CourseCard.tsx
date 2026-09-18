import { Card } from "@/components/ui/card";
import { ArrowUpRight, Award, BookOpen, Users } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { resolveMediaUrl } from "@/lib/media";
import { formatPrice } from "@/lib/price";
import { StarRating } from "@/features/review/components/StarRating";
import { CourseStatus } from "@/client";
import { ROUTES } from "@/routes";
import type { CourseCardData } from "@/features/dashboard/types";

interface CourseCardProps {
  course: CourseCardData;
  className?: string;
  onClick?: (course: CourseCardData) => void;
  alwaysOpenDetail?: boolean;
  alwaysOpenLearn?: boolean;
}

export function CourseCard({
  course,
  className,
  onClick,
  alwaysOpenDetail = false,
  alwaysOpenLearn = false,
}: CourseCardProps) {
  const navigate = useNavigate();
  const cover = resolveMediaUrl(course.cover_url);
  const showProgress = course.progress !== undefined;
  const isDraft = course.status === CourseStatus.DRAFT;
  const memberCount = course.member_count ?? 0;

  const handleCardClick = () => {
    if (onClick) {
      onClick(course);
      return;
    }
    if (alwaysOpenLearn) {
      navigate({
        to: "/learn/$courseId",
        params: { courseId: course.id },
      });
      return;
    }
    if (alwaysOpenDetail || !course.is_member) {
      navigate({
        to: `${ROUTES.COURSE_DETAIL}/$courseId`,
        params: { courseId: course.id },
      });
      return;
    }
    navigate({
      to: "/learn/$courseId",
      params: { courseId: course.id },
    });
  };

  return (
    <Card
      onClick={handleCardClick}
      className={cn(
        "group relative bg-card rounded-xl p-4 w-full flex flex-col justify-between h-52 shadow-[var(--shadow-card)] hover:shadow-glow-primary transition-all duration-200 cursor-pointer overflow-hidden",
        className
      )}
    >
      {/* Верхняя часть: обложка + заголовок */}
      <div className="flex items-start gap-3 min-w-0">
        {cover ? (
          <img
            src={cover}
            alt={course.title}
            className="w-16 h-16 rounded-md object-cover shadow-xs shrink-0"
          />
        ) : (
          <div className="w-16 h-16 rounded-md bg-muted/60 flex items-center justify-center text-muted-foreground shrink-0">
            <BookOpen className="w-6 h-6" />
          </div>
        )}
        <div className="flex flex-col gap-1 min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-bold text-sm sm:text-base text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors">
              {course.title}
            </h3>
            <div className="flex items-center gap-1 shrink-0 mt-0.5">
              {course.certificate_enabled && (
                <span
                  title="Сертификат"
                  className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-reward/10 text-reward"
                >
                  <Award className="w-3.5 h-3.5" />
                </span>
              )}
              <ArrowUpRight className="w-4 h-4 shrink-0 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
          {course.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
              {course.description}
            </p>
          )}
        </div>
      </div>

      {/* Нижняя часть: рейтинг + цена + участники, затем прогресс / статус / подробнее */}
      <div className="pt-2 mt-auto space-y-2">
        {course.rating && course.rating > 0 && (
          <div className="flex items-center gap-1.5">
            <StarRating value={course.rating} readonly size={13} />
            <span className="text-[11px] font-semibold text-foreground tabular-nums">
              {course.rating.toFixed(1)}
            </span>
            {course.rating_count != null && (
              <span className="text-[11px] text-muted-foreground">
                ({course.rating_count})
              </span>
            )}
          </div>
        )}

        {!isDraft && (
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            {course.price === 0 ? (
              <span className="font-bold text-success">Бесплатно</span>
            ) : (
              <span className="font-bold text-destructive">{formatPrice(course.price)} ₽</span>
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
              <span className="text-primary font-bold">{course.progress}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-primary h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${course.progress}%` }}
              />
            </div>
          </div>
        ) : isDraft ? (
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Статус:</span>
            <span className="text-reward bg-reward/10 px-2 py-0.5 rounded-md font-semibold text-[10px]">
              Черновик
            </span>
          </div>
        ) : (
          <span className="flex items-center justify-center gap-1 text-[11px] font-medium text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
            Открыть курс <ArrowUpRight className="w-3 h-3" />
          </span>
        )}
      </div>
    </Card>
  );
}
