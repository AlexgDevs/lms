import { useEffect, useState } from "react"
import { notFound, useNavigate, useParams } from "@tanstack/react-router"
import {
  AlertCircle,
  BookOpen,
  Loader2,
  Sparkles,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useLearnData } from "@/features/learner/api/useLearnData"
import { useLearnerTgp, type TgpPreTestAnswer } from "@/features/learner/api/useTgp"
import { PreTestModal, ResultsModal } from "@/features/learner/components/TgpModals"
import { formatCooldown } from "@/lib/tgp"
import { useEnrollCourse } from "@/features/dashboard/api/useCourses"
import { isLoggedIn } from "@/features/auth/api/useAuth"
import { ROUTES } from "@/routes"
import { TgpDecision } from "@/client"

export function LearnRedirectPage() {
  const { courseId } = useParams({ strict: false })
  const navigate = useNavigate()
  const data = useLearnData({ courseId })
  const enroll = useEnrollCourse()
  const tgp = useLearnerTgp({
    courseId,
    enabled: isLoggedIn() && data.isCourseMember,
    tgpOutdated: data.course?.tgp_outdated ?? false,
  })

  const course = data.course
  const firstLessonId = data.flatUnits[0]?.lesson.id
  const isAuthenticated = isLoggedIn()
  const isMember = data.isCourseMember

  const [showPreTest, setShowPreTest] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [preTestAnswers, setPreTestAnswers] = useState<TgpPreTestAnswer[]>([])

  // Gate: forward to the first lesson when TGP is not relevant for this visitor.
  // Declared before any conditional return so the hook order never changes.
  useEffect(() => {
    if (!courseId || data.isLoading || !course || !firstLessonId) return
    if (!course.tgp_enabled || tgp.taken) {
      if (!showResults) {
        navigate({
          to: "/learn/$courseId/$lessonId",
          params: { courseId, lessonId: firstLessonId },
          replace: true,
        })
      }
    }
  }, [data.isLoading, course, firstLessonId, courseId, tgp.taken, showResults, navigate])

  const goToLesson = (lessonId: string) => {
    if (!courseId) return
    navigate({
      to: "/learn/$courseId/$lessonId",
      params: { courseId, lessonId },
    })
  }

  const handleSelectAnswer = (questionId: string, answerIndex: number) => {
    setPreTestAnswers((prev) => {
      const existing = prev.find((a) => a.question_id === questionId)
      if (existing) {
        return prev.map((a) =>
          a.question_id === questionId
            ? { question_id: questionId, answer_index: answerIndex }
            : a,
        )
      }
      return [...prev, { question_id: questionId, answer_index: answerIndex }]
    })
  }

  const handleSubmit = async () => {
    if (preTestAnswers.length === 0) return
    setShowPreTest(false)
    setShowResults(true)
    try {
      await tgp.submit(preTestAnswers)
    } catch {
      setShowResults(false)
      setShowPreTest(true)
    }
  }

  const handleStartLearning = () => {
    const recommendedModuleId = tgp.result?.modules.find(
      (m) => m.decision === TgpDecision.RECOMMENDED,
    )?.module_id
    const targetLessonId = recommendedModuleId
      ? data.flatUnits.find((u) => u.module.id === recommendedModuleId)?.lesson.id ?? firstLessonId
      : firstLessonId
    if (targetLessonId) goToLesson(targetLessonId)
  }

  const handleRetake = () => {
    tgp.reset()
    setShowResults(false)
    setShowPreTest(true)
    setPreTestAnswers([])
  }

if (data.isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    )
  }

  if (!course) {
    throw notFound()
  }

  if (!firstLessonId) {
    return (
      <div className="mx-auto max-w-2xl py-24 text-center space-y-4">
        <BookOpen className="mx-auto h-10 w-10 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">В этом курсе пока нет материалов.</p>
        <Button variant="outline" size="sm" onClick={() => navigate({ to: ROUTES.CATALOG })}>
          Вернуться в каталог
        </Button>
      </div>
    )
  }

  const shouldNavigateAway = !course.tgp_enabled || tgp.taken

  return (
    <>
      <div className="mx-auto max-w-2xl py-12 sm:py-16 space-y-8">
        <div className="text-center space-y-3">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{course.title}</h1>
          <p className="text-sm text-muted-foreground">
            {course.description || "Начните обучение по этому курсу"}
          </p>
        </div>

        {shouldNavigateAway ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <Card className="rounded-xl p-6 sm:p-8 text-center space-y-5">
            <Sparkles className="mx-auto h-8 w-8 text-primary" />
            <div className="space-y-2">
              <p className="text-lg font-semibold text-foreground">
                Предварительное тестирование
              </p>
              <p className="text-sm text-muted-foreground">
                Ответьте на несколько вопросов, и ИИ составит персональный роадмап: какие модули
                изучать полностью, а какие — выборочно.
              </p>
            </div>

            {!isAuthenticated ? (
              <div className="space-y-3">
                <p className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  Для прохождения теста войдите в аккаунт.
                </p>
                <Button className="w-full" onClick={() => navigate({ to: ROUTES.LOGIN })}>
                  Войти
                </Button>
              </div>
            ) : !isMember ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Чтобы проходить тест и уроки, сначала запишитесь на курс.
                </p>
                <Button
                  className="w-full"
                  disabled={enroll.isPending}
                  onClick={() => enroll.mutate({ path: { course_id: courseId as string } })}
                >
                  {enroll.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  Записаться на курс
                </Button>
              </div>
            ) : tgp.isLoadingQuestions ? (
              <p className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Загружаем вопросы…
              </p>
            ) : tgp.questions.length > 0 ? (
              <div className="space-y-2">
                <Button className="w-full" onClick={() => setShowPreTest(true)}>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Пройти предварительное тестирование
                </Button>
                <Button variant="ghost" className="w-full" onClick={() => goToLesson(firstLessonId)}>
                  Начать без теста
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  Предварительный тест ещё не готов.
                </p>
                <Button variant="outline" className="w-full" onClick={() => goToLesson(firstLessonId)}>
                  Начать без теста
                </Button>
              </div>
            )}
          </Card>
        )}
      </div>

      {showPreTest && tgp.questions.length > 0 && (
        <PreTestModal
          questions={tgp.questions}
          answers={preTestAnswers}
          isSubmitting={tgp.isSubmitting}
          onSelectAnswer={handleSelectAnswer}
          onSubmit={handleSubmit}
          onClose={() => setShowPreTest(false)}
        />
      )}

      {showResults && (
        <ResultsModal
          result={tgp.result}
          isSubmitting={tgp.isSubmitting}
          onStart={handleStartLearning}
          onRetake={handleRetake}
          canRetake={tgp.canRetake}
          retakeCooldownText={
            !tgp.canRetake
              ? `Роадмап можно перегенерировать через ${formatCooldown(tgp.retakeRemainingMs)}`
              : undefined
          }
        />
      )}
    </>
  )
}
