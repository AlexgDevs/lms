import { useState } from "react"
import { Loader2, ShieldCheck, Check, X, FileText, Layers, ListChecks, User, Calendar } from "lucide-react"
import dayjs from "dayjs"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { resolveMediaUrl } from "@/lib/media"
import { useModeration } from "@/features/admin/api/useModeration"
import useAuth from "@/features/auth/api/useAuth"
import type { CourseModerationQueueSchema } from "@/client"

export function ModerationPage() {
  const { user } = useAuth()
  const {
    queue,
    isLoadingQueue,
    approveCourse,
    isApproving,
    rejectCourse,
    isRejecting,
  } = useModeration()

  const [rejectTarget, setRejectTarget] = useState<CourseModerationQueueSchema | null>(
    null,
  )
  const [rejectReason, setRejectReason] = useState("")

  if (!user?.is_staff) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-2">
          <ShieldCheck size={36} className="mx-auto text-muted-foreground/40" />
          <p className="text-sm font-medium text-muted-foreground">
            Доступ только для модераторов
          </p>
        </div>
      </div>
    )
  }

  if (isLoadingQueue) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  const items = queue ?? []

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Модерация курсов</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Курсы, ожидающие публикации. Проверьте содержимое и решите судьбу каждого.
        </p>
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl bg-card shadow-[var(--shadow-card)] p-10 text-center">
          <ShieldCheck size={32} className="mx-auto text-success/60 mb-2" />
          <p className="text-sm font-medium text-foreground">Очередь пуста</p>
          <p className="text-xs text-muted-foreground mt-1">
            Все курсы прошли проверку.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((course) => (
            <div
              key={course.id}
              className="rounded-xl bg-card shadow-[var(--shadow-card)] p-4 space-y-3"
            >
              <div className="flex items-start gap-3">
                {course.cover_url ? (
                  <img
                    src={resolveMediaUrl(course.cover_url)}
                    alt={course.title}
                    className="w-16 h-11 rounded-md object-cover shrink-0"
                  />
                ) : (
                  <div className="w-16 h-11 rounded-md bg-muted/30 flex items-center justify-center shrink-0">
                    <FileText size={16} className="text-muted-foreground/40" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-[15px] leading-snug">
                    {course.title}
                  </h3>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <User size={11} />
                      {course.owner_username}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar size={11} />
                      {dayjs(course.created_at).format("DD MMM YYYY")}
                    </span>
                    <span className="flex items-center gap-1">
                      <Layers size={11} />
                      {course.module_count} мод.
                    </span>
                    <span className="flex items-center gap-1">
                      <ListChecks size={11} />
                      {course.lesson_count} урок. · {course.block_count} блок.
                    </span>
                  </div>
                </div>
              </div>

              {course.description && (
                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                  {course.description}
                </p>
              )}

              {course.moderation_reason && (
                <div className="rounded-lg bg-destructive/5 border border-destructive/20 px-3 py-2 text-xs text-muted-foreground">
                  <span className="font-medium text-destructive">Флаги проверки: </span>
                  {course.moderation_reason}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isRejecting}
                  onClick={() => {
                    setRejectTarget(course)
                    setRejectReason("")
                  }}
                  className="gap-1.5 text-xs h-8"
                >
                  <X size={13} />
                  Отклонить
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={isApproving}
                  onClick={() => approveCourse(course.id)}
                  className="gap-1.5 text-xs h-8 bg-success hover:bg-success/85 text-white"
                >
                  {isApproving ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <Check size={13} />
                  )}
                  Одобрить
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog
        open={Boolean(rejectTarget)}
        onOpenChange={(open) => {
          if (!open) setRejectTarget(null)
        }}
      >
        <DialogContent className="rounded-xl max-w-md">
          <DialogHeader>
            <DialogTitle>Отклонить курс</DialogTitle>
            <DialogDescription>
              Укажите причину отклонения — автор увидит её при отправке заново.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Например: в блоке 3 нецензурная лексика"
            className="min-h-[96px] text-xs rounded-md"
          />
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={isRejecting}
              onClick={() => setRejectTarget(null)}
            >
              Отмена
            </Button>
            <Button
              type="button"
              size="sm"
              variant="destructive"
              disabled={isRejecting || !rejectReason.trim()}
              onClick={() => {
                if (rejectTarget) {
                  rejectCourse(rejectTarget.id, rejectReason.trim())
                  setRejectTarget(null)
                }
              }}
              className="gap-1.5"
            >
              {isRejecting ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <X size={13} />
              )}
              Отклонить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}