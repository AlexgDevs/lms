import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { getErrorMessage } from "@/lib/errors"
import { showErrorToast } from "@/lib/toast"

const API_BASE = import.meta.env.VITE_API_URL ?? ""
const NOTIFICATIONS_URL = `${API_BASE}/api/v1/notifications`

export interface Notification {
  id: string
  user_id: string
  type: string
  title: string
  body: string
  link: string | null
  is_read: boolean
  created_at: string
}

interface NotificationListResponse {
  items: Notification[]
  total: number
  unread_count: number
}

interface UnreadCountResponse {
  count: number
}

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("access_token")}`,
  "Content-Type": "application/json",
})

export const useNotifications = (limit = 20, offset = 0) => {
  return useQuery<NotificationListResponse>({
    queryKey: ["notifications", limit, offset],
    queryFn: async () => {
      const res = await fetch(
        `${NOTIFICATIONS_URL}?limit=${limit}&offset=${offset}`,
        { headers: authHeaders() }
      )
      if (!res.ok) throw new Error("Не удалось загрузить уведомления")
      return res.json()
    },
  })
}

export const useNotificationsInfinite = (pageSize = 20) => {
  return useInfiniteQuery<NotificationListResponse>({
    queryKey: ["notifications", "infinite", pageSize],
    queryFn: async ({ pageParam }) => {
      const res = await fetch(
        `${NOTIFICATIONS_URL}?limit=${pageSize}&offset=${pageParam}`,
        { headers: authHeaders() }
      )
      if (!res.ok) throw new Error("Не удалось загрузить уведомления")
      return res.json()
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.reduce((n, page) => n + page.items.length, 0)
      return loaded < lastPage.total ? loaded : undefined
    },
  })
}

export const useUnreadCount = () => {
  return useQuery<UnreadCountResponse>({
    queryKey: ["notifications", "unread-count"],
    queryFn: async () => {
      const res = await fetch(`${NOTIFICATIONS_URL}/unread-count`, {
        headers: authHeaders(),
      })
      if (!res.ok) throw new Error("Не удалось загрузить счётчик непрочитанных")
      return res.json()
    },
  })
}

export const useMarkAsRead = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const res = await fetch(
        `${NOTIFICATIONS_URL}/${notificationId}/read`,
        {
          method: "PATCH",
          headers: authHeaders(),
        }
      )
      if (!res.ok) throw new Error("Не удалось отметить уведомление как прочитанное")
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] })
    },
    onError: (err) =>
      showErrorToast(getErrorMessage(err) || "Не удалось отметить уведомление как прочитанное"),
  })
}

export const useMarkAllRead = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const res = await fetch(`${NOTIFICATIONS_URL}/read-all`, {
        method: "PATCH",
        headers: authHeaders(),
      })
      if (!res.ok) throw new Error("Не удалось отметить все уведомления прочитанными")
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] })
    },
    onError: (err) =>
      showErrorToast(getErrorMessage(err) || "Не удалось отметить все уведомления прочитанными"),
  })
}
