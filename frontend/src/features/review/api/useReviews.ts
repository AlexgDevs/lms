import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  createReviewApiV1ReviewsPostMutation,
  getRatingApiV1ReviewsTargetTypeTargetIdRatingGetOptions,
  getRatingApiV1ReviewsTargetTypeTargetIdRatingGetQueryKey,
  listReviewsApiV1ReviewsTargetTypeTargetIdGetOptions,
  listReviewsApiV1ReviewsTargetTypeTargetIdGetQueryKey,
} from "@/client/@tanstack/react-query.gen"
import type { ReviewTargetType } from "@/client"
import { getErrorMessage } from "@/lib/errors"
import { showErrorToast, showSuccessToast } from "@/lib/toast"

export interface ReviewQueryParams {
  targetType: ReviewTargetType
  targetId: string
  limit?: number
  offset?: number
  enabled?: boolean
}

export const useReviews = ({
  targetType,
  targetId,
  limit = 10,
  offset = 0,
  enabled = true,
}: ReviewQueryParams) => {
  return useQuery({
    ...listReviewsApiV1ReviewsTargetTypeTargetIdGetOptions({
      path: { target_type: targetType, target_id: targetId },
      query: { limit, offset },
    }),
    enabled: Boolean(targetType && targetId) && enabled,
  })
}

export const useReviewRating = ({
  targetType,
  targetId,
  enabled = true,
}: ReviewQueryParams) => {
  return useQuery({
    ...getRatingApiV1ReviewsTargetTypeTargetIdRatingGetOptions({
      path: { target_type: targetType, target_id: targetId },
    }),
    enabled: Boolean(targetType && targetId) && enabled,
  })
}

export const useCreateReview = () => {
  const queryClient = useQueryClient()

  return useMutation({
    ...createReviewApiV1ReviewsPostMutation(),
    onSuccess: (_, variables) => {
      const body = variables.body
      if (body?.target_type && body?.target_id) {
        queryClient.invalidateQueries({
          queryKey: listReviewsApiV1ReviewsTargetTypeTargetIdGetQueryKey({
            path: { target_type: body.target_type, target_id: body.target_id },
          }),
        })
        queryClient.invalidateQueries({
          queryKey: getRatingApiV1ReviewsTargetTypeTargetIdRatingGetQueryKey({
            path: { target_type: body.target_type, target_id: body.target_id },
          }),
        })
      }
      showSuccessToast("Отзыв отправлен")
    },
    onError: (err) => {
      showErrorToast(getErrorMessage(err) || "Не удалось отправить отзыв")
    },
  })
}
