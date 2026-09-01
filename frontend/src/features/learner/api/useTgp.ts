import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  listTgpQuestionsApiV1AiTgpCourseIdQuestionsGetOptions,
  submitTgpApiV1AiTgpCourseIdSubmitPostMutation,
} from "@/client/@tanstack/react-query.gen"
import type {
  TgpQuestionSchema,
  TgpSubmitAnswerSchema,
  TgpSubmitResponseSchema,
} from "@/client"
import {
  getCooldownEnd,
  TGP_SUBMIT_COOLDOWN_HOURS,
  useCountdown,
} from "@/lib/tgp"
import { showErrorToast } from "@/lib/toast"
import { getErrorMessage } from "@/lib/errors"

export interface UseLearnerTgpParams {
  courseId?: string
  enabled?: boolean
  tgpOutdated?: boolean
}

export type TgpPreTestAnswer = TgpSubmitAnswerSchema

const getDoneKey = (courseId: string) => `tgp_done_${courseId}`
const getResultKey = (courseId: string) => `tgp_result_${courseId}`
const getLastSubmitKey = (courseId: string) => `tgp_last_submit_${courseId}`

function readStoredResult(courseId: string): TgpSubmitResponseSchema | null {
  try {
    const raw = localStorage.getItem(getResultKey(courseId))
    return raw ? (JSON.parse(raw) as TgpSubmitResponseSchema) : null
  } catch {
    return null
  }
}

function readLastSubmittedAt(courseId: string): string | null {
  try {
    return localStorage.getItem(getLastSubmitKey(courseId))
  } catch {
    return null
  }
}

export function useLearnerTgp({
  courseId,
  enabled = true,
  tgpOutdated = false,
}: UseLearnerTgpParams) {
  const queryClient = useQueryClient()
  const isValid = Boolean(courseId)

  const [taken, setTakenState] = useState<boolean>(() => {
    if (!courseId) return false
    try {
      return localStorage.getItem(getDoneKey(courseId)) === "true"
    } catch {
      return false
    }
  })

  const [result, setResultState] = useState<TgpSubmitResponseSchema | null>(() =>
    courseId ? readStoredResult(courseId) : null,
  )

  const [lastSubmittedAt, setLastSubmittedAt] = useState<string | null>(() =>
    courseId ? readLastSubmittedAt(courseId) : null,
  )

  const retakeCooldownEnd = lastSubmittedAt
    ? getCooldownEnd(lastSubmittedAt, TGP_SUBMIT_COOLDOWN_HOURS)
    : null
  const retakeRemainingMs = useCountdown(retakeCooldownEnd, true)
  const canRetake = tgpOutdated || retakeRemainingMs === 0

  const questionsQuery = useQuery({
    ...listTgpQuestionsApiV1AiTgpCourseIdQuestionsGetOptions({
      path: { course_id: courseId as string },
    }),
    enabled: isValid && enabled,
    staleTime: 60_000,
  })

  const submitMutation = useMutation({
    ...submitTgpApiV1AiTgpCourseIdSubmitPostMutation(),
    onSuccess: (data) => {
      setTakenState(true)
      setResultState(data)
      const submittedAt = new Date().toISOString()
      setLastSubmittedAt(submittedAt)
      if (courseId) {
        try {
          localStorage.setItem(getDoneKey(courseId), "true")
          localStorage.setItem(getResultKey(courseId), JSON.stringify(data))
          localStorage.setItem(getLastSubmitKey(courseId), submittedAt)
        } catch {
          // ignore storage errors
        }
      }
      queryClient.invalidateQueries({ queryKey: ["course-progress"] })
      queryClient.invalidateQueries({ queryKey: ["learn-data"] })
    },
    onError: (err) => {
      showErrorToast(getErrorMessage(err) || "Ошибка при отправке ответов")
    },
  })

  const submit = async (answers: TgpPreTestAnswer[]) => {
    if (!courseId) throw new Error("Не передан courseId")
    return submitMutation.mutateAsync({
      path: { course_id: courseId },
      body: { answers },
    })
  }

  const setTaken = (value: boolean) => {
    setTakenState(value)
    if (courseId) {
      try {
        if (value) localStorage.setItem(getDoneKey(courseId), "true")
        else localStorage.removeItem(getDoneKey(courseId))
      } catch {
        // ignore storage errors
      }
    }
  }

  const reset = () => {
    setTakenState(false)
    setResultState(null)
    if (courseId) {
      try {
        localStorage.removeItem(getDoneKey(courseId))
        localStorage.removeItem(getResultKey(courseId))
      } catch {
        // ignore storage errors
      }
    }
  }

  const setResult = (value: TgpSubmitResponseSchema | null) => {
    setResultState(value)
    if (courseId) {
      try {
        if (value) localStorage.setItem(getResultKey(courseId), JSON.stringify(value))
        else localStorage.removeItem(getResultKey(courseId))
      } catch {
        // ignore storage errors
      }
    }
  }

  return {
    questions: (questionsQuery.data ?? []) as TgpQuestionSchema[],
    isLoadingQuestions: questionsQuery.isLoading,
    questionsError: questionsQuery.error,
    refetchQuestions: questionsQuery.refetch,
    submit,
    isSubmitting: submitMutation.isPending,
    taken,
    setTaken,
    reset,
    result,
    setResult,
    lastSubmittedAt,
    retakeRemainingMs,
    canRetake,
  }
}
