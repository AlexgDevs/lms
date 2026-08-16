import { ChevronRight, Loader2, RotateCcw, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {
  TgpDecision,
  type TgpQuestionSchema,
  type TgpSubmitResponseSchema,
} from "@/client"
import type { TgpPreTestAnswer } from "@/features/learner/api/useTgp"

export function PreTestModal({
  questions,
  answers,
  isSubmitting,
  onSelectAnswer,
  onSubmit,
  onClose,
}: {
  questions: TgpQuestionSchema[]
  answers: TgpPreTestAnswer[]
  isSubmitting: boolean
  onSelectAnswer: (questionId: string, answerIndex: number) => void
  onSubmit: () => void
  onClose: () => void
}) {
  const answeredCount = answers.length
  const allAnswered = answeredCount === questions.length

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 flex items-start justify-center p-4 py-10 sm:py-16">
      <Card className="w-full max-w-3xl rounded-xl shadow-2xl">
        <div className="p-6 sm:p-8">
          <div className="flex items-center gap-2 text-primary mb-2">
            <Sparkles className="h-5 w-5" />
            <span className="text-xs font-semibold uppercase tracking-wide">
              Предварительное тестирование
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-foreground">The Golden Path</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Ответьте на вопросы — ИИ определит, какие модули изучать полностью, а какие — выборочно.
          </p>

          <div className="mt-6 space-y-6 max-h-[55vh] overflow-y-auto pr-1">
            {questions.map((question) => {
              const selectedIndex = answers.find(
                (a) => a.question_id === question.id,
              )?.answer_index
              return (
                <div key={question.id} className="space-y-3">
                  <p className="font-medium text-foreground">{question.question_text}</p>
                  <div className="space-y-2">
                    {question.options.map((option, index) => {
                      const checked = selectedIndex === index
                      return (
                        <label
                          key={index}
                          className={cn(
                            "flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors",
                            checked
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50",
                          )}
                        >
                          <input
                            type="radio"
                            name={`tgp-question-${question.id}`}
                            className="h-4 w-4 accent-primary"
                            checked={checked}
                            onChange={() => onSelectAnswer(question.id, index)}
                            disabled={isSubmitting}
                          />
                          <span className="text-sm text-foreground">
                            <span className="font-medium">{String.fromCharCode(65 + index)}.</span>{" "}
                            {option}
                          </span>
                        </label>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
                Пропустить
              </Button>
              <span className="text-xs text-muted-foreground tabular-nums">
                {answeredCount} / {questions.length}
              </span>
            </div>
            <Button
              className="bg-primary hover:bg-primary-hover text-white"
              onClick={onSubmit}
              disabled={!allAnswered || isSubmitting}
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Проверить
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}

export function ResultsModal({
  result,
  isSubmitting,
  onStart,
  onRetake,
  canRetake = true,
  retakeCooldownText,
}: {
  result: TgpSubmitResponseSchema | null
  isSubmitting: boolean
  onStart: () => void
  onRetake: () => void
  canRetake?: boolean
  retakeCooldownText?: string
}) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 flex items-start justify-center p-4 py-10 sm:py-16">
      <Card className="w-full max-w-3xl rounded-xl shadow-2xl">
        <div className="p-6 sm:p-8">
          {isSubmitting || !result ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">ИИ анализирует ваши ответы…</p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 text-primary mb-2">
                <Sparkles className="h-5 w-5" />
                <span className="text-xs font-semibold uppercase tracking-wide">Ваш роадмап</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                Персональный план обучения
              </h2>
              {result.verdict ? (
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                  {result.verdict}
                </p>
              ) : null}

              <div className="mt-6 space-y-3">
                {result.modules.map((module) => {
                  const isRecommended = module.decision === TgpDecision.RECOMMENDED
                  return (
                    <div key={module.module_id} className="rounded-xl border border-border p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-medium text-foreground">{module.module_title}</p>
                        <Badge variant={isRecommended ? "default" : "secondary"}>
                          {isRecommended ? "Изучить полностью" : "Изучить выборочно"}
                        </Badge>
                      </div>
                      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-secondary">
                        <div
                          className={cn(
                            "h-full rounded-full",
                            isRecommended ? "bg-primary" : "bg-muted-foreground/50",
                          )}
                          style={{ width: `${module.score}%` }}
                        />
                      </div>
                      <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground tabular-nums">
                        <span>Уровень знаний</span>
                        <span>{module.score}%</span>
                      </div>
                      {module.reasoning ? (
                        <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                          {module.reasoning}
                        </p>
                      ) : null}
                    </div>
                  )
                })}
              </div>

              <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-col gap-2">
                  <Button
                    variant="outline"
                    onClick={onRetake}
                    disabled={!canRetake}
                    title={!canRetake ? retakeCooldownText : undefined}
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Пройти заново
                  </Button>
                  {retakeCooldownText ? (
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {retakeCooldownText}
                    </span>
                  ) : null}
                </div>
                <Button className="bg-primary hover:bg-primary-hover text-white" onClick={onStart}>
                  Начать обучение
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </>
          )}
        </div>
      </Card>
    </div>
  )
}
