import { useState } from "react"
import {
  Loader2,
  Save,
  Sparkle,
  Trash2,
  Plus,
  CheckCircle2,
  AlertCircle,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { useModules } from "@/features/teaching/api/useModules"
import type { TgpQuestionSchema } from "@/client"
import {
  formatCooldown,
  getCooldownEnd,
  TGP_QUESTION_REGENERATION_COOLDOWN_HOURS,
  useCountdown,
} from "@/lib/tgp"

interface TgpQuestionEditorProps {
  open: boolean
  onClose: () => void
  courseId: string
  questions: TgpQuestionSchema[]
  isLoadingQuestions?: boolean
  onSaveQuestion: (questionId: string, data: QuestionEditData) => Promise<void>
  onRegenerate: (questionId: string) => Promise<void>
  onRefetch: () => Promise<TgpQuestionSchema[] | undefined>
}

export interface QuestionEditData {
  question_text: string
  options: string[]
  correct_option: number
}

interface EditableQuestion extends TgpQuestionSchema {
  draft: QuestionEditData
  isDirty: boolean
}

// The regenerate endpoint only queues a Celery task — poll until the
// question's `updated_at` changes so the regenerated text actually appears.
async function waitForFreshQuestion(
  questionId: string,
  before: string | undefined,
  onRefetch: () => Promise<TgpQuestionSchema[] | undefined>,
) {
  const deadline = Date.now() + 30_000
  while (Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, 1500))
    const res = await onRefetch()
    const fresh = res ?? []
    const target = fresh.find((q) => q.id === questionId)
    if (target && target.updated_at !== before) {
      return
    }
  }
}

export function TgpQuestionEditor({
  open,
  onClose,
  courseId,
  questions,
  isLoadingQuestions,
  onSaveQuestion,
  onRegenerate,
  onRefetch,
}: TgpQuestionEditorProps) {
  const { modules } = useModules({ courseId, onlyCreated: true })
  const moduleTitleMap = new Map(modules.map((m) => [m.id, m.title]))

  const [editable, setEditable] = useState<EditableQuestion[]>([])
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set())
  const [regeneratingIds, setRegeneratingIds] = useState<Set<string>>(new Set())
  const [prevQuestions, setPrevQuestions] = useState<TgpQuestionSchema[]>(questions)

  const questionsByModule = new Map<string, EditableQuestion[]>()
  if (editable.length > 0) {
    for (const q of editable) {
      const arr = questionsByModule.get(q.module_id) ?? []
      arr.push(q)
      questionsByModule.set(q.module_id, arr)
    }
  }

  const sortedModuleIds = Array.from(questionsByModule.keys()).sort((a, b) => {
    const ai = modules.findIndex((m) => m.id === a)
    const bi = modules.findIndex((m) => m.id === b)
    if (ai >= 0 && bi >= 0) return ai - bi
    if (ai >= 0) return -1
    if (bi >= 0) return 1
    return a.localeCompare(b)
  })

const syncFromProps = (qs: TgpQuestionSchema[]) => {
    setEditable(
      qs.map((q) => ({
        ...q,
        draft: {
          question_text: q.question_text,
          options: [...q.options],
          correct_option: q.correct_option,
        },
        isDirty: false,
      }))
    )
  }

  const handleQuestionText = (questionId: string, text: string) => {
    setEditable((prev) =>
      prev.map((q) => {
        if (q.id !== questionId) return q
        const draft = { ...q.draft, question_text: text }
        const isDirty = !isDraftClean(q, draft)
        return { ...q, draft, isDirty }
      })
    )
  }

  const handleOptionText = (
    questionId: string,
    index: number,
    text: string
  ) => {
    setEditable((prev) =>
      prev.map((q) => {
        if (q.id !== questionId) return q
        const options = [...q.draft.options]
        options[index] = text
        const draft = { ...q.draft, options }
        return { ...q, draft, isDirty: !isDraftClean(q, draft) }
      })
    )
  }

  const handleAddOption = (questionId: string) => {
    const q = editable.find((e) => e.id === questionId)
    if (!q) return
    const draft = { ...q.draft, options: [...q.draft.options, ""] }
    setEditable((prev) =>
      prev.map((e) =>
        e.id === questionId ? { ...e, draft, isDirty: !isDraftClean(e, draft) } : e
      )
    )
  }

  const handleRemoveOption = (questionId: string, index: number) => {
    const q = editable.find((e) => e.id === questionId)
    if (!q || q.draft.options.length <= 2) return
    const newOptions = q.draft.options.filter((_, i) => i !== index)
    let newCorrect = q.draft.correct_option
    if (q.draft.correct_option === index) {
      newCorrect = 0
    } else if (q.draft.correct_option > index) {
      newCorrect = q.draft.correct_option - 1
    }
    const draft = { ...q.draft, options: newOptions, correct_option: newCorrect }
    setEditable((prev) =>
      prev.map((e) =>
        e.id === questionId ? { ...e, draft, isDirty: !isDraftClean(e, draft) } : e
      )
    )
  }

  const handleSetCorrect = (questionId: string, index: number) => {
    setEditable((prev) =>
      prev.map((q) => {
        if (q.id !== questionId) return q
        const draft = { ...q.draft, correct_option: index }
        return { ...q, draft, isDirty: !isDraftClean(q, draft) }
      })
    )
  }

  const isDraftClean = (q: EditableQuestion, draft: QuestionEditData) =>
    draft.question_text === q.question_text &&
    JSON.stringify(draft.options) === JSON.stringify(q.options) &&
    draft.correct_option === q.correct_option

  const handleSave = async (questionId: string) => {
    const q = editable.find((e) => e.id === questionId)
    if (!q || !q.isDirty) return

    setSavingIds((prev) => new Set(prev).add(questionId))
    try {
      await onSaveQuestion(questionId, q.draft)
      setEditable((prev) =>
        prev.map((e) =>
          e.id === questionId
            ? {
                ...e,
                question_text: q.draft.question_text,
                options: [...q.draft.options],
                correct_option: q.draft.correct_option,
                draft: { ...q.draft },
                isDirty: false,
              }
            : e
        )
      )
    } finally {
      setSavingIds((prev) => {
        const next = new Set(prev)
        next.delete(questionId)
        return next
      })
      onRefetch()
    }
  }

  const handleSaveAll = async () => {
    const dirty = editable.filter((q) => q.isDirty)
    for (const q of dirty) {
      setSavingIds((prev) => new Set(prev).add(q.id))
      try {
        await onSaveQuestion(q.id, q.draft)
        setEditable((prev) =>
          prev.map((e) =>
            e.id === q.id
              ? {
                  ...e,
                  question_text: q.draft.question_text,
                  options: [...q.draft.options],
                  correct_option: q.draft.correct_option,
                  draft: { ...q.draft },
                  isDirty: false,
                }
              : e
          )
        )
      } finally {
        setSavingIds((prev) => {
          const next = new Set(prev)
          next.delete(q.id)
          return next
        })
      }
    }
    onRefetch()
  }

  const handleRegenerate = async (questionId: string) => {
    setRegeneratingIds((prev) => new Set(prev).add(questionId))
    try {
      const before = editable.find((e) => e.id === questionId)?.updated_at
      await onRegenerate(questionId)
      // The endpoint only queues a Celery task — poll until the question's
      // `updated_at` changes, then the props-sync below applies the new text.
      await waitForFreshQuestion(questionId, before, onRefetch)
    } catch {
      // error toast is handled inside useTgp
    } finally {
      setRegeneratingIds((prev) => {
        const next = new Set(prev)
        next.delete(questionId)
        return next
      })
    }
  }

  // Sync props → editable when questions change (e.g. after regen or full
  // regeneration replaces the questions entirely).
  //
  // Populate whenever `editable` is empty and questions exist — not only when
  // `prevQuestions !== questions` — because on a fresh mount the query may
  // already be resolved, in which case prevQuestions === questions and the
  // initial population branch would never fire.
  if (editable.length === 0 && questions.length > 0) {
    syncFromProps(questions)
  } else if (
    prevQuestions !== questions &&
    editable.length > 0 &&
    !editable.some((q) => q.isDirty)
  ) {
    syncFromProps(questions)
  }
  if (prevQuestions !== questions) {
    setPrevQuestions(questions)
  }

  const anyDirty = editable.some((q) => q.isDirty)
  const anySaving = savingIds.size > 0
  const anyRegenerating = regeneratingIds.size > 0

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="w-[90vw] max-w-4xl max-h-[85vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-lg font-semibold">
                Редактор вопросов TGP
              </DialogTitle>
              <p className="text-xs text-muted-foreground mt-1">
                {editable.length} вопросов по {sortedModuleIds.length} модулям
              </p>
            </div>
            {anyDirty && (
              <div className="text-xs text-primary bg-primary/10 px-2 py-1 rounded">
                Не сохранено: {editable.filter((q) => q.isDirty).length}
              </div>
            )}
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {isLoadingQuestions ? (
            <div className="text-center py-12">
              <Loader2 className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3 animate-spin" />
              <p className="text-sm text-muted-foreground">Загрузка вопросов…</p>
            </div>
          ) : editable.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                Вопросы не найдены. Сгенерируйте тест на вкладке курса.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {sortedModuleIds.map((moduleId) => {
                const moduleQuestions = questionsByModule.get(moduleId) ?? []
                const title =
                  moduleTitleMap.get(moduleId) ??
                  `Модуль: ${moduleId.slice(0, 8)}...`
                return (
                  <div key={moduleId} className="space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <div className="w-5 h-5 rounded bg-reward/10 text-reward flex items-center justify-center text-[10px]">
                        {modules.findIndex((m) => m.id === moduleId) + 1}
                      </div>
                      {title}
                    </h3>
                    {moduleQuestions.map((q) => (
                      <QuestionCard
                        key={q.id}
                        question={q}
                        onQuestionText={handleQuestionText}
                        onOptionText={handleOptionText}
                        onAddOption={handleAddOption}
                        onRemoveOption={handleRemoveOption}
                        onSetCorrect={handleSetCorrect}
                        onSave={() => handleSave(q.id)}
                        onRegenerate={() => handleRegenerate(q.id)}
                        isSaving={savingIds.has(q.id)}
                        isRegenerating={regeneratingIds.has(q.id)}
                      />
                    ))}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <DialogFooter className="mx-0 mb-0 px-6 py-3 border-t border-border/50 bg-muted/30">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={anySaving || anyRegenerating}
          >
            Закрыть
          </Button>
          <Button
            onClick={handleSaveAll}
            disabled={!anyDirty || anySaving}
            className="gap-1.5"
          >
            {anySaving && <Loader2 className="w-3 h-3 animate-spin" />}
            Сохранить все изменения
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface QuestionCardProps {
  question: EditableQuestion
  onQuestionText: (questionId: string, text: string) => void
  onOptionText: (questionId: string, index: number, text: string) => void
  onAddOption: (questionId: string) => void
  onRemoveOption: (questionId: string, index: number) => void
  onSetCorrect: (questionId: string, index: number) => void
  onSave: () => void
  onRegenerate: () => void
  isSaving: boolean
  isRegenerating: boolean
}

function QuestionCard({
  question,
  onQuestionText,
  onOptionText,
  onAddOption,
  onRemoveOption,
  onSetCorrect,
  onSave,
  onRegenerate,
  isSaving,
  isRegenerating,
}: QuestionCardProps) {
  const q = question.draft
  const canRemove = q.options.length > 2

  const regenCooldownEnd = getCooldownEnd(
    question.updated_at,
    TGP_QUESTION_REGENERATION_COOLDOWN_HOURS,
  )
  const regenRemainingMs = useCountdown(regenCooldownEnd, true)
  const canRegenerate = regenRemainingMs === 0

  return (
    <Card className="p-4 space-y-3 rounded-xl">
      <div className="flex items-start gap-3">
        <Textarea
          value={q.question_text}
          onChange={(e) => onQuestionText(question.id, e.target.value)}
          placeholder="Введите вопрос..."
          className="text-sm min-h-[60px] font-sans"
        />
        {question.isDirty && (
          <div
            className="text-xs text-primary shrink-0"
            title="Изменено"
          >
            ●
          </div>
        )}
      </div>

      {question.isDirty && (
        <div className="flex items-start gap-1.5 text-xs text-muted-foreground bg-muted/30 px-2.5 py-1.5 rounded-md">
          <AlertCircle className="w-3 h-3 mt-0.5 shrink-0" />
          <span>Вопрос изменён. Нажмите «Сохранить» чтобы применить правки.</span>
        </div>
      )}

      <div className="space-y-1.5">
        {q.options.map((option, index) => {
          const isCorrect = q.correct_option === index
          return (
            <div key={index} className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onSetCorrect(question.id, index)}
                className={`flex items-center justify-center h-6 w-6 rounded-md border shrink-0 transition-colors ${
                  isCorrect
                    ? "bg-success/10 border-success text-success"
                    : "border-input bg-background text-muted-foreground hover:border-muted-foreground/60"
                }`}
                title={isCorrect ? "Правильный ответ" : "Сделать правильным"}
              >
                <CheckCircle2 className="h-3 w-3" />
              </button>

              <span className="text-[10px] font-mono text-muted-foreground w-4">
                {String.fromCharCode(65 + index)}
              </span>

              <Input
                value={option}
                onChange={(e) =>
                  onOptionText(question.id, index, e.target.value)
                }
                placeholder={`Вариант ${index + 1}...`}
                className="h-7 text-xs"
              />

              {canRemove && (
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 text-muted-foreground hover:text-destructive"
                  onClick={() => onRemoveOption(question.id, index)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          )
        })}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="gap-1 text-[11px]"
          onClick={() => onAddOption(question.id)}
        >
          <Plus className="h-3 w-3" /> Добавить вариант
        </Button>

        <div className="flex items-center gap-1.5 flex-wrap">
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="gap-1 text-[11px]"
            onClick={onRegenerate}
            disabled={!canRegenerate || isRegenerating}
            title={
              !canRegenerate
                ? `Перегенерация доступна через ${formatCooldown(regenRemainingMs)}`
                : undefined
            }
          >
            {isRegenerating ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Sparkle className="h-3 w-3" />
            )}
            Перегенерировать
          </Button>
          {!canRegenerate && (
            <span className="text-[10px] text-muted-foreground tabular-nums">
              {formatCooldown(regenRemainingMs)}
            </span>
          )}

          {question.isDirty && (
            <Button
              type="button"
              size="sm"
              className="gap-1 text-[11px]"
              onClick={onSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Save className="h-3 w-3" />
              )}
              Сохранить
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}
