import { useState } from "react"
import {
  Sparkles,
  Loader2,
  AlertCircle,
  Edit3,
  CheckCircle2,
  Calendar,
  Folder,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { TgpQuestionEditor } from "./TgpQuestionEditor"
import type { TgpQuestionSchema } from "@/client"
import { formatCooldown, getCooldownEnd, useCountdown } from "@/lib/tgp"

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
}: TgpPanelProps) {
  const [editorOpen, setEditorOpen] = useState(false)

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

  return (
    <>
      <Card className="rounded-xl p-4 shadow-[var(--shadow-card)] mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-reward/10 text-reward flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-foreground">
                Pre-testing (The Gold Path)
              </h3>
              <p className="text-xs text-muted-foreground">
                ИИ-генерируемый placement test для идеального роадмапа
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
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
          </div>
        </div>

        {!canGenerate && tgpEnabled && (
          <div className="flex items-start gap-2 text-xs text-destructive/80 bg-destructive/5 px-3 py-2 rounded-md mb-3">
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

          <div className="flex gap-2">
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

            {hasQuestions && (
              <Button
                size="sm"
                variant="ghost"
                className="text-xs gap-1.5"
                onClick={() => setEditorOpen(true)}
              >
                <Folder className="w-3 h-3" />
                Просмотр всех вопросов
              </Button>
            )}
          </div>

          {hasQuestions && !isGenerating && (
            <div className="flex items-center gap-1.5 text-xs text-success bg-success/10 px-2.5 py-1.5 rounded-md">
              <CheckCircle2 className="w-3 h-3" />
              <span>Тест успешно создан и готов к использованию</span>
            </div>
          )}
        </div>
      </Card>

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
