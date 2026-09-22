import { useEffect, useRef } from "react"
import { useQueryClient } from "@tanstack/react-query"

const WS_BASE =
  import.meta.env.VITE_WS_URL ??
  (import.meta.env.DEV
    ? "ws://localhost:8000"
    : `${window.location.protocol === "https:" ? "wss" : "ws"}://${window.location.host}`)

export function useNotificationSocket() {
  const queryClient = useQueryClient()
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    const token = localStorage.getItem("access_token")
    if (!token) return

    const ws = new WebSocket(`${WS_BASE}/ws/notifications?token=${token}`)
    wsRef.current = ws

    ws.onmessage = () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] })
    }

    ws.onerror = () => {
      ws.close()
    }

    ws.onclose = () => {
      wsRef.current = null
    }

    return () => {
      ws.close()
      wsRef.current = null
    }
  }, [queryClient])
}
