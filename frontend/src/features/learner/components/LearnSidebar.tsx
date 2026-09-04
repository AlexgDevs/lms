import { useState } from "react"
import { ChevronRight, Map as MapIcon, Sparkles } from "lucide-react"
import type { LessonSchema, ModuleSchema } from "@/client"
import { cn } from "@/lib/utils"
import { formatCooldown } from "@/lib/tgp"
import { Button } from "@/components/ui/button"
import { AsidePanel } from "@/components/layout/AsidePanel"
import { useNavigate } from "@tanstack/react-router"
import {
  useLearnerTgp,
  type TgpPreTestAnswer,
} from "@/features/learner/api/useTgp"
import {
  PreTestModal,
  ResultsModal,
} from "@/features/learner/components/TgpModals"
import type { FlatLearningUnit } from "@/features/learner/api/useLearnData"
import { isLoggedIn } from "@/features/auth/api/useAuth"
import { TgpDecision } from "@/client"

interface LearnSidebarProps {
  courseTitle: string
  modules: ModuleSchema[]
  lessonsByModule: Map<string, LessonSchema[]>
  currentLessonId?: string
  totalLessons: number
  completedCount: number
  isCompleted: (lessonId: string) => boolean
  onSelectLesson: (lessonId: string) => void
  courseId?: string
  tgpEnabled?: boolean
  tgpOutdated?: boolean
  isMember?: boolean
  flatUnits?: FlatLearningUnit[]
  /** Render the panel full-height (used inside a mobile Sheet) so only the tree scrolls. */
  fill?: boolean
  /** Width utility for the fixed-width column (defaults to "w-80"). */
  widthClassName?: string
}

export function LearnSidebar({
  courseTitle,
  modules,
  lessonsByModule,
  currentLessonId,
  totalLessons,
  completedCount,
  isCompleted,
  onSelectLesson,
  courseId,
  tgpEnabled,
  tgpOutdated,
  isMember,
  flatUnits,
  fill = false,
  widthClassName,
}: LearnSidebarProps) {
  const progressPercent = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0
  const navigate = useNavigate()

  const canTakeTgp = Boolean(courseId && tgpEnabled && isMember && isLoggedIn())
  const tgp = useLearnerTgp({ courseId, enabled: canTakeTgp, tgpOutdated })

  const [showPreTest, setShowPreTest] = useState(false)
  const [showRoadmap, setShowRoadmap] = useState(false)
  const [preTestAnswers, setPreTestAnswers] = useState<TgpPreTestAnswer[]>([])

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
    try {
      await tgp.submit(preTestAnswers)
      setShowPreTest(false)
      setShowRoadmap(true)
    } catch {
      // error toast is handled inside the hook
    }
  }

  const handleStartLearning = () => {
    if (!courseId) return
    const recommendedModuleId = tgp.result?.modules.find(
      (m) => m.decision === TgpDecision.RECOMMENDED,
    )?.module_id
    const targetLessonId = recommendedModuleId
      ? flatUnits?.find((u) => u.module.id === recommendedModuleId)?.lesson.id
      : flatUnits?.[0]?.lesson.id
    setShowRoadmap(false)
    if (targetLessonId) {
      navigate({
        to: "/learn/$courseId/$lessonId",
        params: { courseId, lessonId: targetLessonId },
      })
    }
  }

  const handleRetake = () => {
    tgp.reset()
    setShowRoadmap(false)
    setShowPreTest(true)
    setPreTestAnswers([])
  }

  return (
    <div className={cn("flex flex-col", fill && "h-full")}>
      <AsidePanel
        fill={fill}
        widthClassName={widthClassName}
        bodyClassName="p-2 pr-1"
        header={
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-foreground leading-snug line-clamp-2">
              {courseTitle}
            </h2>

            <div className="flex items-center gap-2">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-primary transition-[width] duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground tabular-nums shrink-0">
                {completedCount}/{totalLessons}
              </span>
            </div>

            {canTakeTgp && (
              <div className="space-y-2">
                {tgp.taken && tgpOutdated && (
                  <p className="flex items-start gap-2 rounded-lg bg-amber-500/10 px-3 py-2 text-xs font-medium text-amber-600">
                    <Sparkles className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                    Добавлен новый контент — рекомендуем пройти тест заново
                  </p>
                )}
                {!tgp.taken ? (
                  tgp.questions.length > 0 ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full py-2 text-sm"
                      onClick={() => setShowPreTest(true)}
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      Пройти предварительное тестирование
                    </Button>
                  ) : (
                    <p className="flex items-start gap-2 rounded-lg bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                      <Sparkles className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                      Тест ещё не готов — приступайте к урокам ниже.
                    </p>
                  )
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full py-2 text-sm"
                    onClick={() => setShowPreTest(true)}
                    disabled={!tgp.canRetake}
                    title={
                      !tgp.canRetake
                        ? "Тест можно пройти заново позже"
                        : undefined
                    }
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Пройти тестирование заново
                  </Button>
                )}
                {!tgp.canRetake && (
                  <span className="block text-xs text-muted-foreground tabular-nums text-center">
                    Тест доступен через {formatCooldown(tgp.retakeRemainingMs)}
                  </span>
                )}
                {tgp.result && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full py-2 text-sm"
                    onClick={() => setShowRoadmap(true)}
                  >
                    <MapIcon className="w-4 h-4 mr-2" />
                    Просмотреть роадмап
                  </Button>
                )}
              </div>
            )}
          </div>
        }
      >
        <nav className="space-y-3">
          {modules.map((module, moduleIndex) => {
            const lessons = lessonsByModule.get(module.id) ?? []
            return (
              <section key={module.id} className="space-y-1">
                <h3 className="px-2 py-1 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide min-w-0">
                  <ChevronRight className="h-3 w-3 text-muted-foreground/60 shrink-0" />
                  <span className="truncate flex-1 min-w-0">
                    {moduleIndex + 1}. {module.title}
                  </span>
                </h3>

                <ul className="space-y-0.5">
                  {lessons.map((lesson) => {
                    const isActive = lesson.id === currentLessonId
                    const isDone = isCompleted(lesson.id)
                    return (
                      <li key={lesson.id}>
                        <LessonItem
                          lesson={lesson}
                          isActive={isActive}
                          isCompleted={isDone}
                          onClick={() => onSelectLesson(lesson.id)}
                        />
                      </li>
                    )
                  })}
                </ul>
              </section>
            )
          })}
        </nav>
      </AsidePanel>

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

      {showRoadmap && (
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
    </div>
  )
}

interface LessonItemProps {
  lesson: LessonSchema
  isActive: boolean
  isCompleted: boolean
  onClick: () => void
}

function LessonItem({ lesson, isActive, isCompleted, onClick }: LessonItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full flex items-start gap-2 rounded-lg px-2 py-1.5 text-left text-sm transition-colors min-w-0",
        isActive
          ? "bg-primary/10 text-foreground font-medium"
          : isCompleted
            ? "bg-muted/60 text-muted-foreground"
            : "text-foreground/75 hover:bg-muted/60 hover:text-foreground",
      )}
    >
      <span className={cn("truncate flex-1 min-w-0", isActive && "text-foreground")}>{lesson.title}</span>
    </button>
  )
}

export { LessonItem }
