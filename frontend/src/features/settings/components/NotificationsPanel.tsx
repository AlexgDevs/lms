import { Bell, CheckCheck, ChevronDown, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import useAuth from "@/features/auth/api/useAuth"
import { useUpdateProfile } from "@/features/settings/api/useSettings"
import {
  useMarkAllRead,
  useMarkAsRead,
  useNotificationsInfinite,
  type Notification,
} from "@/features/notifications/api/useNotifications"

const PAGE_SIZE = 20

export function NotificationsPanel() {
  const { user } = useAuth()
  const updateProfile = useUpdateProfile()

  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useNotificationsInfinite(PAGE_SIZE)

  const markAsRead = useMarkAsRead()
  const markAllRead = useMarkAllRead()

  const notifications = (data?.pages.flatMap((page) => page.items) ?? []) as Notification[]
  const unreadCount = data?.pages[0]?.unread_count ?? 0
  const notificationsEnabled = user?.notifications_enabled ?? true

  const handleToggle = () => {
    updateProfile.mutate({ body: { notifications_enabled: !notificationsEnabled } })
  }

  const handleClick = (notification: Notification) => {
    if (!notification.is_read) {
      markAsRead.mutate(notification.id)
    }
  }

  return (
    <div className="space-y-4">
      {/* Отключить уведомления */}
      <div className="flex items-center justify-between rounded-xl bg-muted/40 px-4 py-3">
        <div>
          <p className="text-sm font-medium text-foreground">Уведомления</p>
          <p className="text-xs text-muted-foreground">
            События курсов, модерации и входа в аккаунт
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={notificationsEnabled}
          onClick={handleToggle}
          disabled={updateProfile.isPending}
          className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 ${
            notificationsEnabled ? "bg-primary" : "bg-muted"
          }`}
        >
          <span
            className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
              notificationsEnabled ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {unreadCount > 0 ? (
            <>{unreadCount} непрочитанных</>
          ) : (
            "Уведомлений нет"
          )}
        </p>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="text-xs h-7"
            onClick={() => markAllRead.mutate()}
            disabled={markAllRead.isPending}
          >
            <CheckCheck className="w-3.5 h-3.5 mr-1" />
            Прочитать все
          </Button>
        )}
      </div>

      <div className="space-y-2">
        {isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
            <Bell className="w-8 h-8 mb-2 opacity-40" />
            <p className="text-sm">Нет уведомлений</p>
          </div>
        ) : (
          <>
            {notifications.map((notification) => (
              <button
                key={notification.id}
                type="button"
                onClick={() => handleClick(notification)}
                className={`w-full text-left px-3 py-2.5 rounded-xl border border-border/60 transition-colors hover:bg-muted/30 ${
                  !notification.is_read ? "bg-primary/5" : ""
                }`}
              >
                <div className="flex items-start gap-3">
                  {!notification.is_read && (
                    <span className="mt-1.5 w-2 h-2 rounded-full bg-primary shrink-0" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground line-clamp-1">
                      {notification.title}
                    </p>
                    {notification.body && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {notification.body}
                      </p>
                    )}
                    <p className="text-[10px] text-muted-foreground/60 mt-1">
                      {new Date(notification.created_at).toLocaleString("ru-RU")}
                    </p>
                  </div>
                </div>
              </button>
            ))}

            {hasNextPage && (
              <Button
                variant="ghost"
                className="w-full text-xs text-muted-foreground"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
              >
                {isFetchingNextPage ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                    Загрузка...
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3.5 h-3.5 mr-1" />
                    Показать ещё
                  </>
                )}
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
