import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  deletePayoutAccountApiV1PaymentsPayoutAccountDeleteMutation,
  getPaymentConfigApiV1PaymentsConfigGetOptions,
  getPaymentConfigApiV1PaymentsConfigGetQueryKey,
  getPayoutAccountApiV1PaymentsPayoutAccountGetOptions,
  getPayoutAccountApiV1PaymentsPayoutAccountGetQueryKey,
  upsertPayoutAccountApiV1PaymentsPayoutAccountPutMutation,
} from "@/client/@tanstack/react-query.gen"
import { getErrorMessage } from "@/lib/errors"
import { showErrorToast, showSuccessToast } from "@/lib/toast"

export const usePayoutAccount = (enabled = true) => {
  return useQuery({
    ...getPayoutAccountApiV1PaymentsPayoutAccountGetOptions(),
    enabled,
  })
}

export const usePaymentConfig = (enabled = true) => {
  return useQuery({
    ...getPaymentConfigApiV1PaymentsConfigGetOptions(),
    enabled,
  })
}

export const useSavePayoutAccount = () => {
  const queryClient = useQueryClient()

  return useMutation({
    ...upsertPayoutAccountApiV1PaymentsPayoutAccountPutMutation(),
    onSuccess: () => {
      showSuccessToast("Реквизиты сохранены")
      queryClient.invalidateQueries({
        queryKey: getPayoutAccountApiV1PaymentsPayoutAccountGetQueryKey(),
      })
    },
    onError: (err) => {
      showErrorToast(getErrorMessage(err) || "Не удалось сохранить реквизиты")
    },
  })
}

export const useDeletePayoutAccount = () => {
  const queryClient = useQueryClient()

  return useMutation({
    ...deletePayoutAccountApiV1PaymentsPayoutAccountDeleteMutation(),
    onSuccess: () => {
      showSuccessToast("Реквизиты удалены")
      queryClient.invalidateQueries({
        queryKey: getPayoutAccountApiV1PaymentsPayoutAccountGetQueryKey(),
      })
    },
    onError: (err) => {
      showErrorToast(getErrorMessage(err) || "Не удалось удалить реквизиты")
    },
  })
}

export function useInvalidatePaymentConfig() {
  const queryClient = useQueryClient()
  return () => {
    queryClient.invalidateQueries({
      queryKey: getPaymentConfigApiV1PaymentsConfigGetQueryKey(),
    })
  }
}
