import { Card } from "@/components/ui/card";
import { Heart, Star, Users, Clock, Award } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Course {
  id: number;
  title: string;
  category: string;
  coverUrl: string;
  author: string;
  rating?: number;
  studentsCount?: number;
  durationHours?: number;
  hasCertificate?: boolean;
  price?: number;
  oldPrice?: number;
  discountBadge?: string;
  isFavorite?: boolean;
  
  // Дополнительные поля для "Моих" и "Создаваемых" курсов
  progress?: number; // % прохождения
  status?: "draft" | "published" | "review"; // статус для авторских
}

interface CourseCardProps {
  course: Course;
  className?: string;
  onToggleFavorite?: (id: number) => void;
  onClick?: (id: number) => void;
}

export function CourseCard({
  course,
  className,
  onToggleFavorite,
  onClick,
}: CourseCardProps) {
  return (
    <Card
      onClick={() => onClick?.(course.id)}
      className={cn(
        "group relative border-border/50 bg-card rounded-2xl p-4 w-full flex flex-col justify-between h-48 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer",
        className
      )}
    >
      {/* ВЕРХНЯЯ ЧАСТЬ: Заголовок, Автор и Аватар */}
      <div className="flex justify-between items-start gap-3">
        {/* Текстовый блок */}
        <div className="flex flex-col gap-1 min-w-0">
          {/* Тег категории/сложности */}
          <span className="text-[10px] font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider truncate">
            {course.category}
          </span>

          {/* Заголовок */}
          <h3 className="font-bold text-sm sm:text-base text-foreground leading-snug line-clamp-2 group-hover:text-purple-600 transition-colors">
            {course.title}
          </h3>

          {/* Автор */}
          <p className="text-xs text-muted-foreground font-medium mt-0.5 truncate">
            {course.author}
          </p>
        </div>

        {/* Аватарка/Обложка курса с кнопкой избранного */}
        <div className="relative shrink-0">
          <img
            src={course.coverUrl}
            alt={course.title}
            className="w-16 h-16 rounded-xl object-cover border border-border/40 shadow-xs"
          />

          {/* Кнопка избранного */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite?.(course.id);
            }}
            className="absolute -top-2 -right-2 p-1.5 rounded-full bg-background/90 border border-border/60 shadow-xs hover:text-red-500 hover:scale-110 active:scale-95 transition-all text-muted-foreground"
            aria-label="В избранное"
          >
            <Heart
              className={cn(
                "w-3.5 h-3.5 transition-colors",
                course.isFavorite && "fill-red-500 text-red-500"
              )}
            />
          </button>
        </div>
      </div>

      {/* НИЖНЯЯ ЧАСТЬ */}
      <div className="flex flex-col gap-2.5 pt-2 border-t border-border/30 mt-auto">
        {/* Иконки метрик (если есть) */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {course.rating !== undefined && (
            <div className="flex items-center gap-1 font-semibold text-foreground">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>{course.rating}</span>
            </div>
          )}

          {course.studentsCount !== undefined && (
            <div className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5 opacity-70" />
              <span>{course.studentsCount}</span>
            </div>
          )}

          {course.durationHours !== undefined && (
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 opacity-70" />
              <span>{course.durationHours} ч</span>
            </div>
          )}

          {course.hasCertificate && (
            <div className="flex items-center gap-1" title="Сертификат">
              <Award className="w-3.5 h-3.5 opacity-70 text-emerald-500" />
            </div>
          )}
        </div>

        {/* Раздел статуса / прогресса / цены */}
        {/* 1. Если это курс, который проходит пользователь (Прогресс) */}
        {course.progress !== undefined ? (
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
        ) : course.status ? (
          /* 2. Если это курс автора (Статус публикации) */
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Статус:</span>
            {course.status === "published" && (
              <span className="text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-md font-semibold text-[10px]">
                Опубликован
              </span>
            )}
            {course.status === "draft" && (
              <span className="text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-md font-semibold text-[10px]">
                Черновик
              </span>
            )}
            {course.status === "review" && (
              <span className="text-blue-600 bg-blue-500/10 px-2 py-0.5 rounded-md font-semibold text-[10px]">
                На проверке
              </span>
            )}
          </div>
        ) : (
          /* 3. Обычная цена для рекомендаций */
          <div className="flex items-center gap-2">
            {course.price === 0 ? (
              <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">
                Бесплатно
              </span>
            ) : (
              <>
                {course.oldPrice && (
                  <span className="text-xs text-muted-foreground line-through">
                    {course.oldPrice.toLocaleString()} ₽
                  </span>
                )}
                <span className="text-base font-extrabold text-red-500 dark:text-red-400">
                  {course.price?.toLocaleString()} ₽
                </span>
                {course.discountBadge && (
                  <span className="text-[10px] font-bold text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded-md ml-auto">
                    {course.discountBadge}
                  </span>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}