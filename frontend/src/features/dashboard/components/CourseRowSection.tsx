import type { LucideIcon } from "lucide-react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { CourseRow } from "@/features/dashboard/components/CourseRow";
import type { CourseCardData } from "@/features/dashboard/types";

interface CourseRowSectionProps {
  title: string;
  icon: LucideIcon;
  accentClassName?: string;
  count?: number;
  courses: CourseCardData[];
  onSeeAll?: () => void;
  onCourseClick?: (course: CourseCardData) => void;
  alwaysOpenLearn?: boolean;
  className?: string;
}

export function CourseRowSection({
  title,
  icon: Icon,
  accentClassName,
  count,
  courses,
  onSeeAll,
  onCourseClick,
  alwaysOpenLearn,
  className,
}: CourseRowSectionProps) {
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
        {onSeeAll && (
          <button
            type="button"
            onClick={onSeeAll}
            className="flex items-center text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Все курсы <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </button>
        )}
      </div>
      <CourseRow
        courses={courses}
        onCourseClick={onCourseClick}
        alwaysOpenLearn={alwaysOpenLearn}
      />
    </section>
  );
}
