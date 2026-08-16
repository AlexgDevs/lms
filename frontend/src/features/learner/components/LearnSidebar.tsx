import { useState } from "react"
import { ChevronRight, Map as MapIcon, Sparkles } from "lucide-react"
import type { LessonSchema, ModuleSchema } from "@/client"
import { cn } from "@/lib/utils"
import { formatCooldown } from "@/lib/tgp"
import { Button } from "@/components/ui/button"
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
  isMember?: boolean
  flatUnits?: FlatLearningUnit[]
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
  isMember,
  flatUnits,
}: LearnSidebarProps) {
  const progressPercent = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0
  const navigate = useNavigate()

  const canTakeTgp = Boolean(courseId && tgpEnabled && isMember && isLoggedIn())
  const tgp = useLearnerTgp({ courseId, enabled: canTakeTgp })

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
    <div className="flex flex-col gap-4">
      <aside className="rounded-xl bg-card p-4 shadow-[var(--shadow-card)]">
        <h2 className="text-sm font-bold text-foreground leading-snug line-clamp-2">{courseTitle}</h2>

        <div className="mt-3 flex items-center gap-2">
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
          <div className="mt-2 space-y-2">
            {!tgp.taken ? (
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
      </aside>

      <nav className="rounded-xl bg-card p-2 space-y-3 max-h-[calc(100vh-17rem)] overflow-y-auto shadow-[var(--shadow-card)]">
        {modules.map((module, moduleIndex) => {
          const lessons = lessonsByModule.get(module.id) ?? []
          return (
            <section key={module.id} className="space-y-1">
              <h3 className="px-2 py-1 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                <ChevronRight className="h-3 w-3 text-muted-foreground/60" />
                {moduleIndex + 1}. {module.title}
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
        "w-full flex items-start gap-2 rounded-lg px-2 py-1.5 text-left text-sm transition-colors",
        isActive
          ? "bg-primary/10 text-foreground font-medium"
          : isCompleted
            ? "bg-muted/60 text-muted-foreground"
            : "text-foreground/75 hover:bg-muted/60 hover:text-foreground",
      )}
    >
      <span className={cn("truncate", isActive && "text-foreground")}>{lesson.title}</span>
    </button>
  )
}

export { LessonItem }
