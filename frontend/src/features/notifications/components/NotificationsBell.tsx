import { useState } from "react"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useUnreadCount } from "@/features/notifications/api/useNotifications"
import { NotificationsPanel } from "@/features/notifications/components/NotificationsPanel"

export function NotificationsBell() {
  const [open, setOpen] = useState(false)
  const { data } = useUnreadCount()
  const unreadCount = data?.count ?? 0

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(!open)}
        className="rounded-full text-muted-foreground hover:text-foreground transition-colors cursor-pointer relative"
        aria-label="Уведомления"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center px-1">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </Button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 z-50">
            <NotificationsPanel onClose={() => setOpen(false)} />
          </div>
        </>
      )}
    </div>
  )
}
