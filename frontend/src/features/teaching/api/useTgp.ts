import { useRef, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import {
  listTgpQuestionsApiV1AiTgpCourseIdQuestionsGetOptions,
  listTgpQuestionsApiV1AiTgpCourseIdQuestionsGetQueryKey,
  generateTgpApiV1AiTgpCourseIdGeneratePostMutation,
  regenerateTgpQuestionApiV1AiTgpQuestionsQuestionIdRegeneratePostMutation,
  submitTgpApiV1AiTgpCourseIdSubmitPostMutation,
  updateTgpQuestionApiV1AiTgpQuestionsQuestionIdPatchMutation,
  updateCourseApiV1CoursesCourseIdPatchMutation,
  getCourseByIdApiV1CoursesCourseIdGetQueryKey,
} from "@/client/@tanstack/react-query.gen"
import { showErrorToast, showSuccessToast, showInfoToast, withLoadingToast } from "@/lib/toast"
import { getErrorMessage } from "@/lib/errors"
import type {
  TgpQuestionSchema,
  TgpQuestionUpdateSchema,
  TgpSubmitRequestSchema,
  TgpSubmitResponseSchema,
  TgpGenerateResponseSchema,
} from "@/client"

export const TGP_MIN_MODULES = 5

export interface UseTgpParams {
  courseId?: string
}

export function useTgp({ courseId }: UseTgpParams = {}) {
  const queryClient = useQueryClient()
  const isValidCourseId = Boolean(courseId)

  const questionsQueryKey = isValidCourseId
    ? listTgpQuestionsApiV1AiTgpCourseIdQuestionsGetQueryKey({
        path: { course_id: courseId as string },
      })
    : undefined

  const courseQueryKey = isValidCourseId
    ? getCourseByIdApiV1CoursesCourseIdGetQueryKey({
        path: { course_id: courseId as string },
        query: { filter: "author" },
      })
    : undefined

  const invalidateCourse = () => {
    if (courseQueryKey) {
      queryClient.invalidateQueries({ queryKey: courseQueryKey })
    }
  }

  const invalidateQuestions = () => {
    if (questionsQueryKey) {
      queryClient.invalidateQueries({ queryKey: questionsQueryKey })
    }
  }

  // --- QUERIES ---

  const {
    data: questions,
    isLoading: isLoadingQuestions,
    error: questionsError,
    refetch: refetchQuestions,
  } = useQuery({
    ...listTgpQuestionsApiV1AiTgpCourseIdQuestionsGetOptions({
      path: { course_id: courseId as string },
    }),
    enabled: isValidCourseId,
    staleTime: 60_000,
  })

  // Regeneration updates questions in place (stable ids), so freshness is
  // detected via the `updated_at` signature rather than the question ids.
  const lastQuestionsSignatureRef = useRef<string>(
    (questions ?? [])
      .map((q) => `${q.id}:${q.updated_at}`)
      .join(","),
  )

  // Timestamp of the last generation started in THIS session. Used so the
  // 24h cooldown UI kicks in immediately, before the async Celery task
  // writes the real `tgp_last_full_generated_at` on the course.
  const [optimisticGeneratedAt, setOptimisticGeneratedAt] = useState<
    string | null
  >(null)

  // The generate endpoint only queues a Celery task. Poll the questions until
  // they are actually updated, so the freshly generated test shows up without
  // a manual reload.
  const pollQuestionsAfterGeneration = async () => {
    const deadline = Date.now() + 90_000
    while (Date.now() < deadline) {
      await new Promise((resolve) => setTimeout(resolve, 3000))
      const res = await refetchQuestions()
      const fresh = res.data
      if (fresh && fresh.length > 0) {
        const signature = fresh
          .map((q) => `${q.id}:${q.updated_at}`)
          .join(",")
        if (signature !== lastQuestionsSignatureRef.current) {
          lastQuestionsSignatureRef.current = signature
          return
        }
      }
    }
  }

  // --- MUTATIONS ---

  // Toggle TGP enabled on the course itself
  const toggleTgpMutation = useMutation({
    ...updateCourseApiV1CoursesCourseIdPatchMutation(),
    onSuccess: () => {
      invalidateCourse()
    },
    onError: (err) => {
      showErrorToast(
        getErrorMessage(err) || "Ошибка при изменении настроек TGP"
      )
    },
  })

  const toggleTgpAsync = async (enabled: boolean) => {
    if (!courseId) throw new Error("Не передан courseId")
    return toggleTgpMutation.mutateAsync({
      path: { course_id: courseId },
      body: { tgp_enabled: enabled },
    })
  }

  // Generate TGP test (async Celery task)
  const generateMutation = useMutation({
    ...generateTgpApiV1AiTgpCourseIdGeneratePostMutation(),
    onSuccess: (_data: TgpGenerateResponseSchema) => {
      if (courseId) setOptimisticGeneratedAt(new Date().toISOString())
      invalidateCourse()
      invalidateQuestions()
      void pollQuestionsAfterGeneration()
    },
    onError: () => {},
  })

  const generateAsync = async () => {
    if (!courseId) throw new Error("Не передан courseId")
    return withLoadingToast(
      generateMutation.mutateAsync({
        path: { course_id: courseId },
      }),
      {
        loading: "Запускаем генерацию теста...",
        success: "Тест TGP успешно запущен. Ожидайте завершения.",
        error: "Ошибка при генерации теста TGP",
      }
    )
  }

  // Regenerate a single question (async Celery task)
  const regenerateMutation = useMutation({
    ...regenerateTgpQuestionApiV1AiTgpQuestionsQuestionIdRegeneratePostMutation(),
    onSuccess: (_data: TgpGenerateResponseSchema) => {
      showInfoToast("Перегенерация вопроса запущена. Подождите.")
      invalidateQuestions()
    },
    onError: (err) => {
      showErrorToast(
        getErrorMessage(err) || "Ошибка при перегенерации вопроса"
      )
    },
  })

  const regenerateAsync = async (questionId: string) => {
    return regenerateMutation.mutateAsync({
      path: { question_id: questionId },
    })
  }

  // Manually update a question
  const updateMutation = useMutation({
    ...updateTgpQuestionApiV1AiTgpQuestionsQuestionIdPatchMutation(),
    onSuccess: () => {
      showSuccessToast("Вопрос сохранён")
      invalidateQuestions()
    },
    onError: (err) => {
      showErrorToast(
        getErrorMessage(err) || "Ошибка при сохранении вопроса"
      )
    },
  })

  const updateAsync = async (
    questionId: string,
    data: TgpQuestionUpdateSchema
  ) => {
    return updateMutation.mutateAsync({
      path: { question_id: questionId },
      body: data,
    })
  }

  // Submit pre-test answers
  const submitMutation = useMutation({
    ...submitTgpApiV1AiTgpCourseIdSubmitPostMutation(),
    onSuccess: () => {
      invalidateCourse()
    },
    onError: (err) => {
      showErrorToast(
        getErrorMessage(err) || "Ошибка при отправке ответов"
      )
    },
  })

  const submitAsync = async (payload: TgpSubmitRequestSchema) => {
    if (!courseId) throw new Error("Не передан courseId")
    return submitMutation.mutateAsync({
      path: { course_id: courseId },
      body: payload,
    })
  }

  return {
    // Data
    questions: (questions ?? []) as TgpQuestionSchema[],
    optimisticGeneratedAt,

    // Query states
    isLoadingQuestions,
    questionsError,
    refetchQuestions,

    // Mutations
    toggleTgpAsync,
    isTogglingTgp: toggleTgpMutation.isPending,

    generateAsync,
    isGenerating: generateMutation.isPending,

    regenerateAsync,
    isRegenerating: regenerateMutation.isPending,

    updateAsync,
    isUpdatingQuestion: updateMutation.isPending,

    submitAsync,
    isSubmitting: submitMutation.isPending,

    submitResult: submitMutation.data as TgpSubmitResponseSchema | undefined,
  }
}
