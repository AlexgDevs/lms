import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  createCheckoutApiV1PaymentsCoursesCourseIdCheckoutPostMutation,
  getCoursePaymentStatusApiV1PaymentsCoursesCourseIdPaymentGetOptions,
  getCoursePaymentStatusApiV1PaymentsCoursesCourseIdPaymentGetQueryKey,
  listMyPaymentsApiV1PaymentsMeGetOptions,
} from "@/client/@tanstack/react-query.gen"
import { getErrorMessage } from "@/lib/errors"
import { showErrorToast } from "@/lib/toast"

export const useMyPayments = (enabled = true) => {
  return useQuery({
    ...listMyPaymentsApiV1PaymentsMeGetOptions(),
    enabled,
  })
}

export const useCoursePaymentStatus = (courseId?: string, refetchInterval?: number) => {
  return useQuery({
    ...getCoursePaymentStatusApiV1PaymentsCoursesCourseIdPaymentGetOptions({
      path: { course_id: courseId as string },
    }),
    enabled: Boolean(courseId),
    refetchInterval,
  })
}

export const useCheckout = () => {
  return useMutation({
    ...createCheckoutApiV1PaymentsCoursesCourseIdCheckoutPostMutation(),
    onSuccess: (data) => {
      if (data?.confirmation_url) {
        window.location.href = data.confirmation_url
      }
    },
    onError: (err) => {
      const courseId =
        (err as { body?: { detail?: string } })?.body?.detail ?? ""
      showErrorToast(getErrorMessage(err) || courseId || "Не удалось перейти к оплате")
    },
  })
}

export function useCoursePaymentInvalidation(courseId?: string) {
  const queryClient = useQueryClient()
  return () => {
    if (courseId) {
      queryClient.invalidateQueries({
        queryKey: getCoursePaymentStatusApiV1PaymentsCoursesCourseIdPaymentGetQueryKey({
          path: { course_id: courseId },
        }),
      })
    }
  }
}
