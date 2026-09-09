import { Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getErrorMessage } from "@/lib/errors"
import { useSessions, useRevokeSession, useRevokeAllSessions } from "../api/useSessions"
import { SessionCard } from "./SessionCard"

export function SessionsPanel() {
  const { data: sessions, isLoading, isError, error } = useSessions()
  const revokeSession = useRevokeSession()
  const revokeAll = useRevokeAllSessions()

  const otherSessions = sessions?.filter((s) => !s.is_current) || []

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-4 h-4" />
          Активные сессии
        </CardTitle>
        <CardDescription>
          Управляйте устройствами, на которых выполнен вход в ваш аккаунт.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="text-sm text-muted-foreground">Загрузка...</div>
        ) : isError ? (
          <p className="text-sm text-destructive">
            {getErrorMessage(error) || "Не удалось загрузить сессии."}
          </p>
        ) : sessions && sessions.length > 0 ? (
          <>
            <div className="space-y-2">
              {sessions.map((session) => (
                <SessionCard
                  key={session.id}
                  session={session}
                  onRevoke={(id) => revokeSession.mutate(id)}
                  isRevoking={revokeSession.isPending}
                />
              ))}
            </div>
            {otherSessions.length > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => revokeAll.mutate()}
                disabled={revokeAll.isPending}
              >
                Выйти из всех остальных
              </Button>
            )}
          </>
        ) : (
          <p className="text-sm text-muted-foreground">Нет активных сессий.</p>
        )}
      </CardContent>
    </Card>
  )
}
