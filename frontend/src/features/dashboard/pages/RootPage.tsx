import type { LucideIcon } from "lucide-react";
import { Edit3, Loader2, PlusCircle, Sparkles } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { isLoggedIn } from "@/features/auth/api/useAuth";
import {
  useCreatedCourses,
  useEnrolledCourses,
  useRecommendedCourses,
} from "@/features/dashboard/api/useCourses";
import { ContinueLearningSection } from "@/features/dashboard/components/ContinueLearningSection";
import { CourseFilters } from "@/features/dashboard/components/CourseFilters";
import { CourseRowSection } from "@/features/dashboard/components/CourseRowSection";
import { ROUTES } from "@/routes";
import type { CourseCardData } from "@/features/dashboard/types";

interface DashboardSection {
  title: string;
  icon: LucideIcon;
  accentClassName?: string;
  count: number;
  courses: CourseCardData[];
}

export function RootPage() {
  const navigate = useNavigate();
  const loggedIn = isLoggedIn();

  const enrolled = useEnrolledCourses(loggedIn);
  const created = useCreatedCourses(12, loggedIn);
  const recommended = useRecommendedCourses(10);

  const enrolledCourses = (enrolled.data ?? []) as CourseCardData[];
  const createdCourses = (created.data ?? []) as CourseCardData[];
  const recommendedCourses = (recommended.data ?? []) as CourseCardData[];

  const isLoading =
    recommended.isLoading || (loggedIn && (enrolled.isLoading || created.isLoading));

  const hasEnrolled = loggedIn && enrolledCourses.length > 0;
  const hasTeaching = loggedIn && createdCourses.length > 0;

  const sections: DashboardSection[] = [];
  const pushRecommended = () => {
    if (recommendedCourses.length > 0 && !sections.some((s) => s.title === "Рекомендуемые")) {
      sections.push({
        title: "Рекомендуемые",
        icon: Sparkles,
        accentClassName: "text-reward",
        count: recommendedCourses.length,
        courses: recommendedCourses,
      });
    }
  };

  if (!hasEnrolled) {
    pushRecommended();
  }

  if (hasEnrolled && !hasTeaching) {
    pushRecommended();
  }

  if (sections.length === 0) pushRecommended();

  const hasContent = hasEnrolled || hasTeaching || sections.length > 0;

  const goToCatalog = () => navigate({ to: ROUTES.CATALOG });

  const goToEditCourse = (course: CourseCardData) => {
    navigate({
      to: `${ROUTES.TEACHING_COURSE}/$courseId`,
      params: { courseId: course.id },
    });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 py-2 px-4 sm:px-6">
      {/* Хедер */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4">
        <div className="shrink-0">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Актуальные курсы
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {loggedIn
              ? "С возвращением! Продолжайте обучение и разработку."
              : "Войдите, чтобы увидеть ваши курсы и прогресс."}
          </p>
        </div>
        <button
          type="button"
          onClick={goToCatalog}
          className="px-4 py-1.5 text-xs font-medium rounded-full bg-primary hover:bg-primary-hover text-white transition-colors shadow-sm"
        >
          Каталог
        </button>
      </div>

      {/* Ряды курсов */}
      {isLoading && !hasContent ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : !hasContent ? (
        <div className="text-center py-20 text-muted-foreground text-sm">
          Курсы пока не найдены.
        </div>
      ) : (
        <>
          {hasEnrolled && (
            <ContinueLearningSection
              title="Мои курсы"
              count={enrolledCourses.length}
              courses={enrolledCourses}
              filters={<CourseFilters />}
            />
          )}
          {hasTeaching && (
            <ContinueLearningSection
              title="Преподавание и разработка"
              icon={PlusCircle}
              count={createdCourses.length}
              courses={createdCourses}
              onCourseClick={goToEditCourse}
              rowActionLabel="Редактировать"
              rowActionIcon={Edit3}
              showProgress={false}
            />
          )}
          {sections.map((section) => (
            <CourseRowSection
              key={section.title}
              title={section.title}
              icon={section.icon}
              accentClassName={section.accentClassName}
              count={section.count}
              courses={section.courses}
            />
          ))}
        </>
      )}
    </div>
  );
}
