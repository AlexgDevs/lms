import { useMutation } from "@tanstack/react-query"
import {
  assistantHintApiV1AiAssistantHintPostMutation,
  assistantRegenerateApiV1AiAssistantRegeneratePostMutation,
} from "@/client/@tanstack/react-query.gen"
import type {
  AssistantAction,
  AssistantAngle,
  AssistantAskRequestSchema,
  AssistantHintRequestSchema,
  AssistantHintResponseSchema,
  AssistantLevelResponseSchema,
  AssistantMessageSchema,
  AssistantRegenerateRequestSchema,
} from "@/client"
import { AssistantFocus } from "@/client"
import { streamAssistantAsk } from "@/lib/assistant"
import { showErrorToast } from "@/lib/toast"
import { getErrorMessage } from "@/lib/errors"

export function useAssistant() {
  const hintMutation = useMutation({
    ...assistantHintApiV1AiAssistantHintPostMutation(),
    onError: (err) => {
      showErrorToast(getErrorMessage(err) || "Не удалось получить подсказку")
    },
  })

  const regenerateMutation = useMutation({
    ...assistantRegenerateApiV1AiAssistantRegeneratePostMutation(),
    onError: (err) => {
      showErrorToast(getErrorMessage(err) || "Не удалось объяснить иначе")
    },
  })

  const requestHint = async (input: {
    courseId: string
    lessonId: string
    blockId: string
    focus?: AssistantFocus
  }): Promise<AssistantHintResponseSchema> => {
    const body: AssistantHintRequestSchema = {
      course_id: input.courseId,
      lesson_id: input.lessonId,
      block_id: input.blockId,
      focus: input.focus ?? AssistantFocus.CONFUSED,
    }
    return hintMutation.mutateAsync({ body })
  }

  const regenerateLevel = async (input: {
    courseId: string
    lessonId: string
    blockId: string
    levelIndex: number
    angle?: AssistantAngle
  }): Promise<AssistantLevelResponseSchema> => {
    const body: AssistantRegenerateRequestSchema = {
      course_id: input.courseId,
      lesson_id: input.lessonId,
      block_id: input.blockId,
      level_index: input.levelIndex,
      angle: input.angle,
    }
    return regenerateMutation.mutateAsync({ body })
  }

  const streamAsk = async (input: {
    courseId: string
    lessonId: string
    blockId: string
    question: string
    history: AssistantMessageSchema[]
    revealedLevels: number
    action?: AssistantAction
    currentCode?: string
    onDelta: (delta: string) => void
  }): Promise<void> => {
    const body: AssistantAskRequestSchema = {
      course_id: input.courseId,
      lesson_id: input.lessonId,
      block_id: input.blockId,
      question: input.question,
      history: input.history,
      revealed_levels: input.revealedLevels,
      action: input.action,
      current_code: input.currentCode,
    }
    try {
      await streamAssistantAsk(body, input.onDelta)
    } catch (err) {
      showErrorToast(getErrorMessage(err) || "Ошибка при ответе Ирбиса")
      throw err
    }
  }

  return {
    requestHint,
    regenerateLevel,
    streamAsk,
    isGenerating: hintMutation.isPending || regenerateMutation.isPending,
  }
}