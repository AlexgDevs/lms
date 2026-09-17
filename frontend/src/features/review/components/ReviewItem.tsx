import { useState } from "react"
import { Link } from "@tanstack/react-router"
import { MessageSquare, ShieldCheck, Sparkles } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ReplyForm } from "./ReplyForm"
import type { ReviewSchema } from "@/client"
import { cn } from "@/lib/utils"
import { resolveMediaUrl } from "@/lib/media"
import useAuth from "@/features/auth/api/useAuth"
import { ROUTES } from "@/routes"

interface ReviewItemProps {
  review: ReviewSchema
  canReply?: boolean
  isReply?: boolean
  onReplySubmit?: (parentId: string, text: string) => void
  isSubmittingReply?: boolean
}

const COLLAPSED_REPLIES = 3

export function ReviewItem({
  review,
  canReply = false,
  isReply = false,
  onReplySubmit,
  isSubmittingReply = false,
}: ReviewItemProps) {
  const [replyOpen, setReplyOpen] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const { user: currentUser } = useAuth()

  const username = review.user_username || "Пользователь"
  const initial = username.charAt(0).toUpperCase()
  const avatarSrc = resolveMediaUrl(review.user_avatar_url ?? undefined)
  const isStaff = Boolean(review.user_is_staff)
  const isFounder = Boolean(review.user_is_founder)
  const isOwn = currentUser?.id === review.user_id

  const replies = review.replies ?? []
  const hasReplies = replies.length > 0
  const visibleReplies = expanded ? replies : replies.slice(0, COLLAPSED_REPLIES)
  const hiddenCount = replies.length - COLLAPSED_REPLIES

  const dateStr = (() => {
    try {
      return new Date(review.created_at).toLocaleString("ru-RU", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch {
      return new Date(review.created_at).toLocaleDateString("ru-RU")
    }
  })()

  // Root — Stepik-like card: avatar left, content right, separated by gap
  // Reply — compact, smaller avatar, tighter spacing
  return (
    <div
      className={cn(
        "group",
        !isReply
          ? "rounded-xl border border-border bg-card p-3 sm:p-4 shadow-[var(--shadow-card)]"
          : "py-1"
      )}
    >
      <div className="flex gap-3">
        {isOwn ? (
          <Link
            to={ROUTES.PROFILE}
            className="shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            aria-label={`Профиль ${username}`}
          >
            <Avatar
              className={cn(
                "shrink-0 border border-border/60 overflow-hidden",
                isReply ? "h-7 w-7" : "h-9 w-9 sm:h-10 sm:w-10"
              )}
            >
              {avatarSrc ? (
                <AvatarImage src={avatarSrc} alt={username} />
              ) : null}
              <AvatarFallback className={cn(isReply ? "text-[10px]" : "text-xs", "font-semibold bg-primary/10 text-primary")}>
                {initial}
              </AvatarFallback>
            </Avatar>
          </Link>
        ) : (
          <Link
            to={ROUTES.USER_PROFILE}
            params={{ userId: review.user_id }}
            className="shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            aria-label={`Профиль ${username}`}
          >
            <Avatar
              className={cn(
                "shrink-0 border border-border/60 overflow-hidden",
                isReply ? "h-7 w-7" : "h-9 w-9 sm:h-10 sm:w-10"
              )}
            >
              {avatarSrc ? (
                <AvatarImage src={avatarSrc} alt={username} />
              ) : null}
              <AvatarFallback className={cn(isReply ? "text-[10px]" : "text-xs", "font-semibold bg-primary/10 text-primary")}>
                {initial}
              </AvatarFallback>
            </Avatar>
          </Link>
        )}

        <div className="min-w-0 flex-1">
          {/* header: name + badges + dot + date */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {isOwn ? (
              <Link
                to={ROUTES.PROFILE}
                className={cn(
                  "font-semibold text-foreground hover:text-primary transition-colors truncate",
                  isReply ? "text-xs" : "text-sm"
                )}
              >
                {username}
              </Link>
            ) : (
              <Link
                to={ROUTES.USER_PROFILE}
                params={{ userId: review.user_id }}
                className={cn(
                  "font-semibold text-foreground hover:text-primary transition-colors truncate",
                  isReply ? "text-xs" : "text-sm"
                )}
              >
                {username}
              </Link>
            )}
            {isFounder && (
              <Badge className="h-4 px-1.5 text-[10px] bg-reward text-white border-reward/20 gap-0.5 font-semibold">
                <Sparkles className="h-2.5 w-2.5" />
                Основатель
              </Badge>
            )}
            {isStaff && !isFounder && (
              <Badge variant="secondary" className="h-4 px-1.5 text-[10px] gap-0.5 font-medium">
                <ShieldCheck className="h-2.5 w-2.5" />
                Преподаватель
              </Badge>
            )}
            <span className="text-[11px] text-muted-foreground">·</span>
            <span className="text-[11px] text-muted-foreground tabular-nums">{dateStr}</span>
            {review.is_edited && (
              <span className="text-[11px] text-muted-foreground/60">(изм.)</span>
            )}
          </div>

          <p
            className={cn(
              "text-foreground/90 leading-relaxed whitespace-pre-wrap break-words",
              isReply ? "mt-1 text-[13px] sm:text-sm" : "mt-2 text-sm"
            )}
          >
            {review.text}
          </p>

          {!isReply && canReply && onReplySubmit && (
            <div className="mt-2.5">
              {replyOpen ? (
                <div className="rounded-lg border border-border bg-muted/20 p-3">
                  <ReplyForm
                    onSubmit={(text) => {
                      onReplySubmit(review.id, text)
                      setReplyOpen(false)
                    }}
                    isSubmitting={isSubmittingReply}
                    onCancel={() => setReplyOpen(false)}
                  />
                </div>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 -ml-2 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
                  onClick={() => setReplyOpen(true)}
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  Ответить
                </Button>
              )}
            </div>
          )}

          {/* Threaded replies — Stepik vertical line with dots */}
          {hasReplies && !isReply && (
            <div className="mt-4">
              <div className="relative ml-1 sm:ml-2 pl-4 sm:pl-5 border-l border-border/60 space-y-3">
                {visibleReplies.map((reply) => (
                  <div key={reply.id} className="relative">
                    {/* dot on the line */}
                    <span className="absolute -left-[17px] sm:-left-[21px] top-3 h-2 w-2 rounded-full bg-border border-2 border-card shadow-sm" />
                    <ReviewItem review={reply} isReply />
                  </div>
                ))}
              </div>

              {hiddenCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-3 h-7 text-xs gap-1 text-primary hover:text-primary"
                  onClick={() => setExpanded((v) => !v)}
                >
                  {expanded ? (
                    "Свернуть"
                  ) : (
                    <>
                      Показать ещё {hiddenCount} {hiddenCount === 1 ? "ответ" : hiddenCount < 5 ? "ответа" : "ответов"}
                    </>
                  )}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
