import { ChevronRight, Loader2, RotateCcw, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
    <Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Предварительное тестирование
          </DialogTitle>
          <DialogDescription>
            Ответьте на вопросы — ИИ определит, какие модули изучать полностью, а какие — выборочно.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-2">
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

        <DialogFooter className="flex-row !justify-between items-center">
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
              Пропустить
            </Button>
            <span className="text-xs text-muted-foreground tabular-nums">
              {answeredCount} / {questions.length}
            </span>
          </div>
          <Button
            onClick={onSubmit}
            disabled={!allAnswered || isSubmitting}
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Проверить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
    <Dialog open onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        {isSubmitting || !result ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">ИИ анализирует ваши ответы…</p>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Ваш роадмап
              </DialogTitle>
              <DialogDescription>
                Персональный план обучения
              </DialogDescription>
            </DialogHeader>

            {result.verdict ? (
              <p className="text-sm text-muted-foreground leading-relaxed">
                {result.verdict}
              </p>
            ) : null}

            <div className="space-y-3">
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

            <DialogFooter className="flex-row !justify-between items-center">
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
              <Button onClick={onStart}>
                Начать обучение
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
