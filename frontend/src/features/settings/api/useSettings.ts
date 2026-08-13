import { useMutation, useQueryClient } from "@tanstack/react-query"
import { getCurrentUserApiV1UsersMeGetQueryKey, updateCurrentUserApiV1UsersMePatchMutation } from "@/client/@tanstack/react-query.gen"
import { getErrorMessage } from "@/lib/errors"
import { showErrorToast, showSuccessToast } from "@/lib/toast"

export const useUpdateProfile = () => {
    const queryClient = useQueryClient()

    return useMutation({
        ...updateCurrentUserApiV1UsersMePatchMutation(),
        onSuccess: () => {
            showSuccessToast("Профиль успешно обновлён")
            queryClient.invalidateQueries({
                queryKey: getCurrentUserApiV1UsersMeGetQueryKey(),
            })
        },
        onError: (err) => {
            showErrorToast(getErrorMessage(err) || "Ошибка при обновлении профиля")
        },
    })
}
