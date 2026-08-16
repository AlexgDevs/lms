import { notFound, useNavigate, useParams } from "@tanstack/react-router";
import { ArrowLeft, BookOpen, Loader2, Play, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { resolveMediaUrl } from "@/lib/media";
import { useCourseDetail } from "@/features/dashboard/api/useCourseDetail";
import { useEnrollCourse } from "@/features/dashboard/api/useCourses";
import useAuth, { isLoggedIn } from "@/features/auth/api/useAuth";
import { ROUTES } from "@/routes";

export function CoursePage() {
  const { courseId } = useParams({ strict: false });
  const navigate = useNavigate();
  const { user } = useAuth();
  const enroll = useEnrollCourse();
  const { course, modules, lessonsByModule, isLoading } =
    useCourseDetail(courseId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!course) {
    throw notFound();
  }

  const cover = resolveMediaUrl(course.cover_url);
  const memberCount = course.member_count ?? 0;
  const loggedIn = isLoggedIn();
  const isOwner = Boolean(user && user.id === course.owner_id);
  const isMember = Boolean(course.is_member);

  const handleEnroll = () => {
    if (!loggedIn) {
      navigate({ to: ROUTES.LOGIN });
      return;
    }
    enroll.mutate({ path: { course_id: course.id } });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 py-2 px-4 sm:px-6">
      <button
        type="button"
        onClick={() => navigate({ to: ROUTES.CATALOG })}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Каталог курсов
      </button>

      {/* Обложка + основная информация */}
      <Card className="rounded-xl overflow-hidden">
        <div className="flex flex-col md:flex-row gap-5 p-5">
          {cover ? (
            <img
              src={cover}
              alt={course.title}
              className="w-full md:w-56 h-40 rounded-md object-cover shadow-xs shrink-0"
            />
          ) : (
            <div className="w-full md:w-56 h-40 rounded-md bg-muted/60 flex items-center justify-center text-muted-foreground shrink-0">
              <BookOpen className="w-10 h-10" />
            </div>
          )}

          <div className="flex-1 min-w-0 space-y-3">
            <h1 className="text-xl sm:text-2xl font-bold text-foreground leading-snug">
              {course.title}
            </h1>

            {course.description && (
              <p className="text-sm text-muted-foreground leading-relaxed">
                {course.description}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground pt-1">
              {course.price === 0 ? (
                <span className="font-bold text-success">
                  Бесплатно
                </span>
              ) : (
                <span className="font-bold text-destructive">
                  {course.price.toLocaleString()} ₽
                </span>
              )}
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                {memberCount} участников
              </span>
            </div>

            <div className="pt-1">
              {isMember ? (
                <span className="inline-flex items-center text-sm font-semibold text-success bg-success/10 px-4 py-2 rounded-md">
                  Вы записаны
                </span>
              ) : isOwner ? (
                <span className="inline-flex items-center text-xs font-semibold text-primary bg-primary/10 px-4 py-2 rounded-md">
                  Это ваш курс
                </span>
              ) : (
                <Button
                  size="lg"
                  disabled={enroll.isPending}
                  onClick={handleEnroll}
                  className="bg-primary hover:bg-primary-hover text-white"
                >
                  {enroll.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  {enroll.isPending ? "Запись..." : "Записаться на курс"}
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Содержание: модули и уроки */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-foreground">Содержание курса</h2>

        {modules.length === 0 ? (
          <Card className="rounded-xl p-8 text-center text-sm text-muted-foreground">
            Модули пока не добавлены.
          </Card>
        ) : (
          modules.map((module, moduleIndex) => {
            const lessons = lessonsByModule.get(module.id) ?? [];
            return (
              <Card key={module.id} className="rounded-xl p-4 sm:p-5">
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 shrink-0 rounded-md bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                    {moduleIndex + 1}
                  </span>
                  <h3 className="font-bold text-sm sm:text-base text-foreground leading-snug">
                    {module.title}
                  </h3>
                </div>

                {module.description && (
                  <p className="text-xs text-muted-foreground mt-2 ml-10 leading-relaxed">
                    {module.description}
                  </p>
                )}

                {lessons.length > 0 && (
                  <ul className="mt-3 ml-10 space-y-1.5 border-l border-border/40 pl-4">
                    {lessons.map((lesson, lessonIndex) => (
                      <li key={lesson.id} className="flex items-center gap-2 text-sm text-foreground/90">
                        <Play className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        <span className="text-muted-foreground tabular-nums shrink-0">
                          {lessonIndex + 1}.
                        </span>
                        {isMember ? (
                          <button
                            type="button"
                            onClick={() =>
                              navigate({
                                to: "/learn/$courseId/$lessonId",
                                params: { courseId: course.id, lessonId: lesson.id },
                              })
                            }
                            className="truncate text-left hover:text-primary transition-colors"
                          >
                            {lesson.title}
                          </button>
                        ) : (
                          <span className="truncate">{lesson.title}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
