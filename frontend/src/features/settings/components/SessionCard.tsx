import { Monitor, Smartphone, Tablet, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import type { Session } from "../api/useSessions"

function getDeviceIcon(deviceName: string | null) {
  if (!deviceName) return <Monitor className="w-5 h-5" />
  const lower = deviceName.toLowerCase()
  if (lower.includes("android") || lower.includes("iphone") || lower.includes("ios"))
    return <Smartphone className="w-5 h-5" />
  if (lower.includes("ipad") || lower.includes("tablet"))
    return <Tablet className="w-5 h-5" />
  return <Monitor className="w-5 h-5" />
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

interface SessionCardProps {
  session: Session
  onRevoke: (sessionId: string) => void
  isRevoking?: boolean
}

export function SessionCard({ session, onRevoke, isRevoking }: SessionCardProps) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="text-muted-foreground shrink-0">
            {getDeviceIcon(session.device_name)}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">
              {session.device_name || "Неизвестное устройство"}
            </p>
            <p className="text-xs text-muted-foreground">
              {session.ip_address && `${session.ip_address} · `}
              {formatDate(session.created_at)}
            </p>
          </div>
        </div>
        <div className="shrink-0">
          {session.is_current ? (
            <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
              Текущая
            </span>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRevoke(session.id)}
              disabled={isRevoking}
            >
              <LogOut className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}
