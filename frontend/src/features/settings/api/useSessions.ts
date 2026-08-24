import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { getErrorMessage } from "@/lib/errors"
import { showErrorToast, showSuccessToast } from "@/lib/toast"

const API_BASE = import.meta.env.VITE_API_URL || "/api/v1"

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem("access_token")
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export interface Session {
  id: string
  device_name: string | null
  ip_address: string | null
  created_at: string
  is_current: boolean
}

async function fetchSessions(currentToken: string): Promise<Session[]> {
  const res = await fetch(
    `${API_BASE}/auth/sessions?current_token=${encodeURIComponent(currentToken)}`,
    { headers: authHeaders() },
  )
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

async function revokeSession(sessionId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/auth/sessions/${sessionId}`, {
    method: "DELETE",
    headers: authHeaders(),
  })
  if (!res.ok) throw new Error(await res.text())
}

async function revokeAllSessions(currentToken: string): Promise<void> {
  const res = await fetch(
    `${API_BASE}/auth/sessions?current_token=${encodeURIComponent(currentToken)}`,
    { method: "DELETE", headers: authHeaders() },
  )
  if (!res.ok) throw new Error(await res.text())
}

export function useSessions() {
  const currentToken = localStorage.getItem("refresh_token") || ""
  return useQuery({
    queryKey: ["sessions"],
    queryFn: () => fetchSessions(currentToken),
    enabled: !!currentToken,
  })
}

export function useRevokeSession() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: revokeSession,
    onSuccess: () => {
      showSuccessToast("Сессия завершена")
      queryClient.invalidateQueries({ queryKey: ["sessions"] })
    },
    onError: (err) => {
      showErrorToast(getErrorMessage(err) || "Ошибка при завершении сессии")
    },
  })
}

export function useRevokeAllSessions() {
  const queryClient = useQueryClient()
  const currentToken = localStorage.getItem("refresh_token") || ""
  return useMutation({
    mutationFn: () => revokeAllSessions(currentToken),
    onSuccess: () => {
      showSuccessToast("Все остальные сессии завершены")
      queryClient.invalidateQueries({ queryKey: ["sessions"] })
    },
    onError: (err) => {
      showErrorToast(
        getErrorMessage(err) || "Ошибка при завершении сессий",
      )
    },
  })
}
