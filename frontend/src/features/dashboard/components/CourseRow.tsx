import { cn } from "@/lib/utils";
import { CourseCard } from "@/features/dashboard/components/CourseCard";
import type { CourseCardData } from "@/features/dashboard/types";

interface CourseRowProps {
  courses: CourseCardData[];
  className?: string;
  onCourseClick?: (course: CourseCardData) => void;
  alwaysOpenLearn?: boolean;
}

export function CourseRow({
  courses,
  className,
  onCourseClick,
  alwaysOpenLearn,
}: CourseRowProps) {
  return (
    <div
      className={cn(
        "flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        className
      )}
    >
      {courses.map((course) => (
        <div key={course.id} className="snap-start shrink-0 w-72 max-w-[80vw]">
          <CourseCard
            course={course}
            onClick={onCourseClick}
            alwaysOpenLearn={alwaysOpenLearn}
          />
        </div>
      ))}
    </div>
  );
}
