import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  generateCourseApiV1CoursesGeneratePostMutation,
  getAiGenerationQuotaApiV1UsersMeAiGenerationsGetOptions,
  getAiGenerationQuotaApiV1UsersMeAiGenerationsGetQueryKey,
} from "@/client/@tanstack/react-query.gen"
import { getErrorMessage } from "@/lib/errors"
import { showErrorToast } from "@/lib/toast"
import { isApiError } from "@/api/errors"

export const useAiGenerationQuota = () => {
  return useQuery({
    ...getAiGenerationQuotaApiV1UsersMeAiGenerationsGetOptions(),
  })
}

export const useGenerateCourse = () => {
  const queryClient = useQueryClient()

  return useMutation({
    ...generateCourseApiV1CoursesGeneratePostMutation(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: getAiGenerationQuotaApiV1UsersMeAiGenerationsGetQueryKey(),
      })
    },
    onError: (err) => {
      const message =
        isApiError(err) && err.status === 429
          ? "Лимит бесплатных генераций курса исчерпан"
          : getErrorMessage(err) || "Не удалось начать генерацию"
      showErrorToast(message)
      queryClient.invalidateQueries({
        queryKey: getAiGenerationQuotaApiV1UsersMeAiGenerationsGetQueryKey(),
      })
    },
  })
}
