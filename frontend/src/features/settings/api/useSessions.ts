import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query"
import {
  listSessionsApiV1AuthSessionsGetOptions,
  revokeAllSessionsApiV1AuthSessionsDeleteMutation,
  revokeSessionApiV1AuthSessionsSessionIdDeleteMutation,
} from "@/client/@tanstack/react-query.gen"
import { getErrorMessage } from "@/lib/errors"
import { showErrorToast, showSuccessToast } from "@/lib/toast"
import type { SessionSchema } from "@/client/types.gen"

export type Session = SessionSchema

export function getCurrentRefreshToken(): string {
  return localStorage.getItem("refresh_token") || ""
}

function invalidateSessions(queryClient: QueryClient) {
  queryClient.invalidateQueries({
    predicate: (query) =>
      Array.isArray(query.queryKey) &&
      typeof query.queryKey[0] === "object" &&
      query.queryKey[0] !== null &&
      (query.queryKey[0] as { _id?: string })._id ===
        "listSessionsApiV1AuthSessionsGet",
  })
}

export function useSessions() {
  const currentToken = getCurrentRefreshToken()
  return useQuery({
    ...listSessionsApiV1AuthSessionsGetOptions({
      query: { current_token: currentToken },
    }),
    enabled: !!currentToken,
  })
}

export function useRevokeSession() {
  const queryClient = useQueryClient()
  return useMutation({
    ...revokeSessionApiV1AuthSessionsSessionIdDeleteMutation(),
    onSuccess: () => {
      showSuccessToast("Сессия завершена")
      invalidateSessions(queryClient)
    },
    onError: (err) => {
      showErrorToast(getErrorMessage(err) || "Ошибка при завершении сессии")
    },
  })
}

export function useRevokeAllSessions() {
  const queryClient = useQueryClient()
  return useMutation({
    ...revokeAllSessionsApiV1AuthSessionsDeleteMutation(),
    onSuccess: () => {
      showSuccessToast("Все остальные сессии завершены")
      invalidateSessions(queryClient)
    },
    onError: (err) => {
      showErrorToast(
        getErrorMessage(err) || "Ошибка при завершении сессий",
      )
    },
  })
}
