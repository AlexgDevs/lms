import { notFound, useNavigate, useParams } from "@tanstack/react-router";
import type { ReactNode } from "react";
import {
  ArrowLeft,
  Award,
  BookOpen,
  Check,
  ChevronDown,
  Layers,
  Loader2,
  Play,
  User,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { resolveMediaUrl } from "@/lib/media";
import { formatPrice } from "@/lib/price";
import { useCourseDetail } from "@/features/dashboard/api/useCourseDetail";
import { useEnrollCourse, useUnenrollCourse } from "@/features/dashboard/api/useCourses";
import useAuth, { isLoggedIn } from "@/features/auth/api/useAuth";
import { useCheckout, useCoursePaymentStatus } from "@/features/payment/api/usePayments";
import { ReviewSection } from "@/features/review/components/ReviewSection";
import { TinyRating } from "@/features/review/components/TinyRating";
import { ROUTES } from "@/routes";

export function CoursePage() {
  const { courseId } = useParams({ strict: false });
  const navigate = useNavigate();
  const { user } = useAuth();
  const enroll = useEnrollCourse();
  const unenroll = useUnenrollCourse();
  const checkout = useCheckout();
  const { course, modules, lessonsByModule, isLoading } =
    useCourseDetail(courseId);

  // Poll payment status after returning from checkout: while a paid course is
  // not yet a membership, query the status until the webhook enrolls the user.
  const loggedIn = isLoggedIn();
  const wantsPaymentStatus =
    Boolean(course?.price && course?.price > 0) &&
    !course?.is_member &&
    loggedIn;
  const paymentStatus = useCoursePaymentStatus(
    wantsPaymentStatus ? course?.id : undefined,
    wantsPaymentStatus ? 4000 : undefined,
  );

  // "Недавний чекаут" — пользователь только что перешёл к оплате, вебхук ещё не
  // записал его в курс. Маркер ставится в useCheckout, снимается при записи/отписке
  // и умирает вместе с вкладкой (sessionStorage), поэтому дополнительный таймер не
  // нужен: без него stale-маркер не влияет на UI (paid==false или is_member==true).
  const recentCheckout = Boolean(
    course?.id && sessionStorage.getItem(`checkout:${course.id}`),
  );

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
  const isOwner = Boolean(user && user.id === course.owner_id);
  const isMember = Boolean(course.is_member);
  const paid = paymentStatus.data?.paid ?? false;
  // "Ожидание доступа" — только в узком окне после свежего чекаута, пока вебхук
  // ещё не записал пользователя. Если курс оплачен давно, а пользователь отписался,
  // доступ к нему не теряется: повторная запись бесплатна (бэкенд разрешает её).
  const waitingForAccess = paid && !isMember && recentCheckout;
  const ownsCourse = paid && !isMember;

  const lessonCount = modules.reduce(
    (n, module) => n + (lessonsByModule.get(module.id) ?? []).length,
    0,
  );

  const handleEnroll = () => {
    if (!loggedIn) {
      navigate({ to: ROUTES.LOGIN });
      return;
    }
    enroll.mutate({ path: { course_id: course.id } });
  };

  const handleBuy = () => {
    if (!loggedIn) {
      navigate({ to: ROUTES.LOGIN });
      return;
    }
    checkout.mutate({ path: { course_id: course.id } });
  };

  const handleGoLearn = () => {
    navigate({ to: "/learn/$courseId", params: { courseId: course.id } });
  };

  const isPaid = (course.price ?? 0) > 0;

  const ctaStates = [
    {
      show: isMember,
      node: (
        <div className="flex flex-col gap-2">
          <Button size="lg" className="w-full" onClick={handleGoLearn}>
            Начать обучение
          </Button>
          <Button
            variant="outline"
            disabled={unenroll.isPending}
            onClick={() => unenroll.mutate(course.id)}
          >
            {unenroll.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            Отписаться
          </Button>
        </div>
      ),
    },
    {
      show: isOwner,
      node: (
        <span className="inline-flex items-center justify-center w-full text-xs font-semibold text-primary bg-primary/10 px-4 py-2 rounded-md">
          Это ваш курс
        </span>
      ),
    },
    {
      show: waitingForAccess,
      node: (
        <span className="inline-flex items-center justify-center w-full text-sm font-semibold text-success bg-success/10 px-4 py-2 rounded-md">
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Оплата получена, открываем доступ...
        </span>
      ),
    },
    {
      show: ownsCourse,
      node: (
        <Button size="lg" className="w-full" disabled={enroll.isPending} onClick={handleEnroll}>
          {enroll.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
          {enroll.isPending ? "Запись..." : "Записаться на курс"}
        </Button>
      ),
    },
    {
      show: isPaid,
      node: (
        <Button size="lg" className="w-full" disabled={checkout.isPending} onClick={handleBuy}>
          {checkout.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
          {checkout.isPending ? "Переход к оплате..." : `Получить доступ · ${formatPrice(course.price)} ₽`}
        </Button>
      ),
    },
    {
      show: true,
      node: (
        <Button size="lg" className="w-full" disabled={enroll.isPending} onClick={handleEnroll}>
          {enroll.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
          {enroll.isPending ? "Запись..." : "Записаться на курс"}
        </Button>
      ),
    },
  ];

  const ctaNode = ctaStates.find((state) => state.show)?.node ?? null;

  return (
    <div className="space-y-8 py-2">
      <button
        type="button"
        onClick={() => navigate({ to: ROUTES.CATALOG })}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Каталог курсов
      </button>

      {/* Hero: cover + info (CTA lives in the sidebar) */}
      <Card className="rounded-xl overflow-hidden">
        <div className="bg-gradient-to-br from-primary/10 via-transparent to-transparent border-b border-border/40">
          <div className="flex flex-col md:flex-row gap-5 p-5 sm:p-6">
            {cover ? (
              <img
                src={cover}
                alt={course.title}
                className="w-full md:w-60 h-40 rounded-lg object-cover shadow-xs shrink-0"
              />
            ) : (
              <div className="w-full md:w-60 h-40 rounded-lg bg-muted/60 flex items-center justify-center text-muted-foreground shrink-0">
                <BookOpen className="w-10 h-10" />
              </div>
            )}

            <div className="flex-1 min-w-0 space-y-3">
              <h1 className="text-xl sm:text-2xl font-bold text-foreground leading-snug">
                {course.title}
              </h1>

              {course.description && (
                <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                  {course.description}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground pt-1">
                {course.owner_username && (
                  <span className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" />
                    {course.owner_username}
                    <TinyRating targetType="user" targetId={course.owner_id} />
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  {memberCount} участников
                </span>
                <span className="flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5" />
                  {modules.length} модуля(ей) · {lessonCount} уроков
                </span>
                <span
                  className={`ml-auto text-base font-bold ${course.price === 0 ? "text-success" : "text-destructive"}`}
                >
                  {course.price === 0 ? "Бесплатно" : `${formatPrice(course.price)} ₽`}
                </span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Two-column: content (left) + sticky purchase (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-8">
          {course.description && (
            <section className="space-y-3">
              <h2 className="text-lg font-bold text-foreground">Об этом курсе</h2>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-none">
                {course.description}
              </p>
            </section>
          )}

          <section className="space-y-4">
            <h2 className="text-lg font-bold text-foreground">Содержание курса</h2>

            {modules.length === 0 ? (
              <Card className="rounded-xl p-8 text-center text-sm text-muted-foreground">
                Модули пока не добавлены.
              </Card>
            ) : (
              <div className="space-y-3">
                {modules.map((module, moduleIndex) => {
                  const lessons = lessonsByModule.get(module.id) ?? [];
                  return (
                    <details
                      key={module.id}
                      className="group rounded-xl bg-card border border-border/60 shadow-[var(--shadow-card)] open:shadow-glow-primary"
                    >
                      <summary className="flex items-center gap-3 p-4 cursor-pointer list-none">
                        <span className="w-7 h-7 shrink-0 rounded-md bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                          {moduleIndex + 1}
                        </span>
                        <h3 className="font-bold text-sm sm:text-base text-foreground leading-snug flex-1">
                          {module.title}
                        </h3>
                        <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform group-open:rotate-180" />
                      </summary>

                      <div className="px-4 pb-4 pl-[3.75rem]">
                        {module.description && (
                          <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                            {module.description}
                          </p>
                        )}

                        {lessons.length > 0 ? (
                          <ul className="space-y-1.5 border-l border-border/40 pl-4">
                            {lessons.map((lesson, lessonIndex) => (
                              <li
                                key={lesson.id}
                                className="flex items-center gap-2 text-sm text-foreground/90"
                              >
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
                        ) : (
                          <p className="text-xs text-muted-foreground">Уроков пока нет.</p>
                        )}
                      </div>
                    </details>
                  );
                })}
              </div>
            )}
          </section>

          <ReviewSection
            targetType="course"
            targetId={course.id}
            title="Отзывы о курсе"
            showRating
            canWrite={loggedIn}
          />
        </div>

        {/* Right sticky column */}
        <aside className="lg:sticky lg:top-24 space-y-6">
          <Card className="rounded-xl overflow-hidden shadow-[var(--shadow-card)]">
            <CardContent className="p-5 space-y-4">
              {cover ? (
                <img
                  src={cover}
                  alt={course.title}
                  className="w-full h-32 rounded-lg object-cover"
                />
              ) : (
                <div className="w-full h-32 rounded-lg bg-muted/60 flex items-center justify-center text-muted-foreground">
                  <BookOpen className="w-8 h-8" />
                </div>
              )}

              <div className="flex items-baseline justify-between">
                <span
                  className={`text-2xl font-bold ${course.price === 0 ? "text-success" : "text-foreground"}`}
                >
                  {course.price === 0 ? "Бесплатно" : `${formatPrice(course.price)} ₽`}
                </span>
                {course.rating != null && (
                  <span className="text-xs text-muted-foreground">
                    ★ {course.rating.toFixed(1)}
                  </span>
                )}
              </div>

              {ctaNode}

              <div className="flex items-center gap-2 w-full text-sm text-success bg-success/10 px-3 py-2 rounded-md">
                <Check className="w-4 h-4" />
                Этот курс доступен сразу после записи
              </div>

              <div className="grid grid-cols-2 gap-2 text-center text-xs">
                <StatsCell value={String(memberCount)} label="участников" icon={<Users className="w-4 h-4" />} />
                <StatsCell value={String(modules.length)} label="модулей" icon={<Layers className="w-4 h-4" />} />
                <StatsCell value={String(lessonCount)} label="уроков" icon={<BookOpen className="w-4 h-4" />} />
                <StatsCell
                  value={course.certificate_enabled ? "Да" : "—"}
                  label="сертификат"
                  icon={<Award className="w-4 h-4" />}
                />
              </div>

              {course.owner_username && (
                <div className="flex items-center gap-3 border-t border-border/60 pt-4">
                  <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                    <User className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Преподаватель</p>
                    <p className="text-sm font-semibold text-foreground truncate">
                      {course.owner_username}
                    </p>
                  </div>
                  <div className="ml-auto">
                    <TinyRating targetType="user" targetId={course.owner_id} />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function StatsCell({
  value,
  label,
  icon,
}: {
  value: string;
  label: string;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-lg bg-muted/40 px-2 py-2.5">
      <div className="flex items-center justify-center gap-1 text-foreground">{icon}</div>
      <div className="mt-1 text-sm font-bold text-foreground">{value}</div>
      <div className="text-[10px] text-muted-foreground">{label}</div>
    </div>
  );
}
