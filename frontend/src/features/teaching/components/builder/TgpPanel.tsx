import { useState } from "react"
import {
  Sparkles,
  Loader2,
  AlertCircle,
  Edit3,
  CheckCircle2,
  Calendar,
  ChevronDown,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { TgpQuestionEditor } from "./TgpQuestionEditor"
import type { TgpQuestionSchema } from "@/client"
import { formatCooldown, getCooldownEnd, useCountdown } from "@/lib/tgp"
import { cn } from "@/lib/utils"

interface TgpPanelProps {
  courseId: string
  tgpEnabled: boolean
  tgpLastGeneratedAt?: string | null
  tgpCooldownHours?: number
  moduleCount: number
  minModules: number
  questions: TgpQuestionSchema[]
  isLoadingQuestions?: boolean
  isGenerating: boolean
  isUpdatingCourse: boolean
  isSavingQuestion: boolean
  isRegenerating: boolean
  onToggleTgp: (enabled: boolean) => Promise<void>
  onGenerate: () => Promise<void>
  onSaveQuestion: (
    questionId: string,
    data: { question_text: string; options: string[]; correct_option: number }
  ) => Promise<void>
  onRegenerate: (questionId: string) => Promise<void>
  onRefetch: () => Promise<TgpQuestionSchema[] | undefined>
  /** Компактный вариант без карточной обёртки (для Popover «Настройки курса»). */
  plain?: boolean
}

export function TgpPanel({
  courseId,
  tgpEnabled,
  tgpLastGeneratedAt,
  tgpCooldownHours = 24,
  moduleCount,
  minModules,
  questions,
  isLoadingQuestions,
  isGenerating,
  isUpdatingCourse,
  isSavingQuestion,
  isRegenerating,
  onToggleTgp,
  onGenerate,
  onSaveQuestion,
  onRegenerate,
  onRefetch,
  plain = false,
}: TgpPanelProps) {
  const [editorOpen, setEditorOpen] = useState(false)
  const [open, setOpen] = useState(false)

  const canGenerate = moduleCount >= minModules
  const hasQuestions = questions.length > 0
  const isMutating =
    isGenerating || isUpdatingCourse || isSavingQuestion || isRegenerating

  const regenCooldownEnd = getCooldownEnd(tgpLastGeneratedAt, tgpCooldownHours)
  const regenRemainingMs = useCountdown(regenCooldownEnd, tgpEnabled)
  const canRegenerate = canGenerate && regenRemainingMs === 0

  const handleGenerate = async () => {
    await onGenerate()
  }

  const handleToggle = async () => {
    await onToggleTgp(!tgpEnabled)
  }

  const body = open && (
    <div className={plain ? "space-y-3 pb-1" : "px-4 pb-4 space-y-3"}>
      {!canGenerate && tgpEnabled && (
        <div className="flex items-start gap-2 text-xs text-destructive/80 bg-destructive/5 px-3 py-2 rounded-md">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>
            Для генерации теста нужно минимум {minModules} модулей.
            Сейчас: {moduleCount}.
          </span>
        </div>
      )}

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Checkbox
              id="tgp-enabled"
              checked={tgpEnabled}
              onCheckedChange={handleToggle}
              disabled={isMutating || isUpdatingCourse}
            />
            <Label htmlFor="tgp-enabled" className="text-xs cursor-pointer">
              Включить предварительное тестирование
            </Label>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {!tgpEnabled ? (
            <Button
              size="sm"
              variant="outline"
              className="text-xs gap-1.5"
              disabled={isMutating || isUpdatingCourse}
              onClick={() => handleToggle()}
            >
              <Sparkles className="w-3 h-3" />
              Включить и сгенерировать
            </Button>
          ) : (
            <>
              <Button
                size="sm"
                className="text-xs gap-1.5"
                disabled={!canRegenerate || isGenerating || !tgpEnabled}
                onClick={handleGenerate}
                title={
                  regenRemainingMs > 0
                    ? `Перегенерация доступна через ${formatCooldown(regenRemainingMs)}`
                    : undefined
                }
              >
                {isGenerating ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Sparkles className="w-3 h-3" />
                )}
                {hasQuestions
                  ? "Перегенерировать весь тест"
                  : "Сгенерировать тест"}
              </Button>

              {regenRemainingMs > 0 && (
                <span className="self-center text-xs text-muted-foreground tabular-nums">
                  Перегенерация доступна через {formatCooldown(regenRemainingMs)}
                </span>
              )}

              {hasQuestions && (
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs gap-1.5"
                  disabled={isMutating}
                  onClick={() => setEditorOpen(true)}
                >
                  <Edit3 className="w-3 h-3" />
                  Редактировать вопросы
                </Button>
              )}
            </>
          )}
        </div>

        {hasQuestions && !isGenerating && (
          <div className="flex items-center gap-1.5 text-xs text-success bg-success/10 px-2.5 py-1.5 rounded-md">
            <CheckCircle2 className="w-3 h-3" />
            <span>Тест успешно создан и готов к использованию</span>
          </div>
        )}
      </div>
    </div>
  )

  const badges = (
    <>
      {hasQuestions && (
        <span className="text-xs text-muted-foreground bg-muted/30 px-2 py-0.5 rounded">
          {questions.length} вопросов
        </span>
      )}
      {tgpLastGeneratedAt && (
        <span
          className="text-xs text-muted-foreground bg-muted/30 px-2 py-0.5 rounded flex items-center gap-1"
          title="Последняя генерация"
        >
          <Calendar className="w-3 h-3" />
          {new Date(tgpLastGeneratedAt).toLocaleDateString("ru-RU")}
        </span>
      )}
    </>
  )

  return (
    <>
      {plain ? (
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => setOpen((prev) => !prev)}
            className="w-full flex items-center justify-between gap-3 text-left hover:bg-muted/40 rounded-md px-1.5 py-1.5 -mx-1.5 transition-colors"
          >
            <div className="flex items-center gap-2 min-w-0">
              <Sparkles className="w-3.5 h-3.5 text-reward shrink-0" />
              <span className="font-semibold text-xs text-foreground truncate">
                Pre-testing (The Gold Path)
              </span>
              <span className="text-[11px] text-muted-foreground shrink-0">
                {tgpEnabled ? "Вкл" : "Выкл"}
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {badges}
              <ChevronDown
                size={16}
                className={cn(
                  "text-muted-foreground transition-transform",
                  !open && "-rotate-90",
                )}
              />
            </div>
          </button>
          {body && <div className="pl-6">{body}</div>}
        </div>
      ) : (
        <Card className="rounded-xl shadow-[var(--shadow-card)] mb-4 overflow-hidden">
          <button
            type="button"
            onClick={() => setOpen((prev) => !prev)}
            className="w-full p-4 flex items-center justify-between gap-3 text-left"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-md bg-reward/10 text-reward flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-sm text-foreground">
                  Pre-testing (The Gold Path)
                </h3>
                <p className="text-xs text-muted-foreground">
                  ИИ-генерируемый placement test для идеального роадмапа
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {badges}
              <ChevronDown
                size={16}
                className={cn(
                  "text-muted-foreground transition-transform",
                  !open && "-rotate-90",
                )}
              />
            </div>
          </button>

          {body}
        </Card>
      )}

      <TgpQuestionEditor
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        courseId={courseId}
        questions={questions}
        isLoadingQuestions={isLoadingQuestions}
        onSaveQuestion={onSaveQuestion}
        onRegenerate={onRegenerate}
        onRefetch={onRefetch}
      />
    </>
  )
}
