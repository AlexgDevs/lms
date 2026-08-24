import { useNavigate } from "@tanstack/react-router"
import { CheckCheck, Bell, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  useNotifications,
  useMarkAsRead,
  useMarkAllRead,
} from "@/features/notifications/api/useNotifications"

interface NotificationsPanelProps {
  onClose: () => void
}

export function NotificationsPanel({ onClose }: NotificationsPanelProps) {
  const navigate = useNavigate()
  const { data, isLoading } = useNotifications()
  const markAsRead = useMarkAsRead()
  const markAllRead = useMarkAllRead()

  const notifications = data?.items ?? []
  const unreadCount = data?.unread_count ?? 0

  const handleClick = (notification: (typeof notifications)[0]) => {
    if (!notification.is_read) {
      markAsRead.mutate(notification.id)
    }
    if (notification.link) {
      navigate({ to: notification.link })
    }
    onClose()
  }

  return (
    <div className="w-[360px] max-h-[480px] rounded-xl bg-card border border-border shadow-lg overflow-hidden flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-primary" />
          <h3 className="font-bold text-sm">Уведомления</h3>
          {unreadCount > 0 && (
            <span className="text-xs text-muted-foreground">
              ({unreadCount} непрочитанных)
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => markAllRead.mutate()}
            disabled={markAllRead.isPending}
            className="text-xs h-7"
          >
            <CheckCheck className="w-3.5 h-3.5 mr-1" />
            Прочитать все
          </Button>
        )}
      </div>

      <div className="overflow-y-auto flex-1">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <Bell className="w-8 h-8 mb-2 opacity-40" />
            <p className="text-sm">Нет уведомлений</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <button
              key={notification.id}
              type="button"
              onClick={() => handleClick(notification)}
              className={`w-full text-left px-4 py-3 border-b border-border/40 last:border-0 transition-colors hover:bg-muted/30 ${
                !notification.is_read ? "bg-primary/5" : ""
              }`}
            >
              <div className="flex items-start gap-3">
                {!notification.is_read && (
                  <span className="mt-1.5 w-2 h-2 rounded-full bg-primary shrink-0" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {notification.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                    {notification.body}
                  </p>
                  <p className="text-[10px] text-muted-foreground/60 mt-1">
                    {new Date(notification.created_at).toLocaleString("ru-RU")}
                  </p>
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  )
}
