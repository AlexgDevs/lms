import {
  BookOpen,
  CheckCircle2,
  Clock,
  CreditCard,
  Sparkles,
  Wand2,
} from "lucide-react"
import { useNavigate } from "@tanstack/react-router"
import { PaymentKind, type PaymentSchema } from "@/client"
import { formatPrice } from "@/lib/price"

const statusLabel: Record<string, string> = {
  pending: "Ожидает оплаты",
  succeeded: "Оплачено",
  failed: "Не оплачено",
}

const kindLabel: Record<string, string> = {
  [PaymentKind.COURSE]: "Курс",
  [PaymentKind.AI_ASSISTANT_SUBSCRIPTION]: "ИИ-помощник",
  [PaymentKind.COURSE_GENERATION]: "Генерация курса",
}

function kindIcon(kind: string) {
  switch (kind) {
    case PaymentKind.AI_ASSISTANT_SUBSCRIPTION:
      return <Sparkles className="h-5 w-5" />
    case PaymentKind.COURSE_GENERATION:
      return <Wand2 className="h-5 w-5" />
    default:
      return <BookOpen className="h-5 w-5" />
  }
}

function productTitle(payment: PaymentSchema): string {
  switch (payment.kind) {
    case PaymentKind.AI_ASSISTANT_SUBSCRIPTION:
      return "Подписка на ИИ-помощника"
    case PaymentKind.COURSE_GENERATION:
      return "Генерация курса"
    default:
      return payment.course_title || "Покупка курса"
  }
}

function StatusBadge({ status }: { status: string }) {
  const cls =
    status === "succeeded"
      ? "text-success"
      : status === "pending"
        ? "text-muted-foreground"
        : "text-destructive"

  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${cls}`}>
      {status === "succeeded" ? (
        <CheckCircle2 className="h-3.5 w-3.5" />
      ) : status === "pending" ? (
        <Clock className="h-3.5 w-3.5" />
      ) : (
        <CreditCard className="h-3.5 w-3.5" />
      )}
      {statusLabel[status] ?? status}
    </span>
  )
}

export function PaymentListItem({ payment }: { payment: PaymentSchema }) {
  const navigate = useNavigate()
  const kind = payment.kind ?? PaymentKind.COURSE
  const isCourse = kind === PaymentKind.COURSE && Boolean(payment.course_id)

  const content = (
    <>
      <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-primary/10 text-primary">
        {isCourse && payment.course_cover_url ? (
          <img
            src={payment.course_cover_url}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          kindIcon(kind)
        )}
      </div>

      <div className="min-w-0 space-y-0.5">
        <p className="truncate text-sm font-medium text-foreground">
          {productTitle(payment)}
        </p>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
            {kindLabel[kind] ?? kind}
          </span>
          <span className="text-[11px] text-muted-foreground">
            {new Date(payment.created_at).toLocaleDateString("ru-RU")}
          </span>
        </div>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-1">
        <p className="text-sm font-semibold text-foreground">{formatPrice(payment.amount)} ₽</p>
        <StatusBadge status={payment.status} />
      </div>
    </>
  )

  if (isCourse) {
    return (
      <button
        type="button"
        onClick={() =>
          navigate({
            to: "/courses/$courseId",
            params: { courseId: payment.course_id as string },
          })
        }
        className="flex w-full items-center justify-between gap-3 rounded-lg bg-muted/30 px-3 py-2.5 text-left transition-colors hover:bg-muted/50 cursor-pointer"
      >
        {content}
      </button>
    )
  }

  return (
    <div className="flex w-full items-center justify-between gap-3 rounded-lg bg-muted/30 px-3 py-2.5">
      {content}
    </div>
  )
}
