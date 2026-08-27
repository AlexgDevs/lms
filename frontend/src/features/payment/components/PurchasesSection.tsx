import { CreditCard, Loader2, CheckCircle2, Clock } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { useMyPayments } from "@/features/payment/api/usePayments"
import type { PaymentSchema } from "@/client"

const statusLabel: Record<string, string> = {
  pending: "Ожидает оплаты",
  succeeded: "Оплачено",
  failed: "Не оплачено",
}

export function PurchasesSection() {
  const { data, isLoading } = useMyPayments()
  const payments = data ?? []

  return (
    <Card className="rounded-xl shadow-[var(--shadow-card)]">
      <CardContent className="p-4">
        <h2 className="flex items-center gap-2 mb-3 font-bold text-sm text-foreground">
          <CreditCard className="h-4 w-4 text-primary" />
          Мои покупки
        </h2>

        {isLoading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : payments.length === 0 ? (
          <p className="py-4 text-center text-xs text-muted-foreground">
            Покупок пока нет.
          </p>
        ) : (
          <div className="space-y-2.5">
            {payments.map((payment: PaymentSchema) => (
              <div
                key={payment.id}
                className="flex items-center justify-between gap-3 rounded-lg bg-muted/30 px-3 py-2.5"
              >
                <div className="min-w-0 space-y-1">
                  <p className="text-sm font-medium text-foreground">
                    {payment.amount} ₽
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {new Date(payment.created_at).toLocaleDateString("ru-RU")}
                  </p>
                </div>
                <span
                  className={
                    payment.status === "succeeded"
                      ? "inline-flex items-center gap-1 text-xs font-medium text-success"
                      : payment.status === "pending"
                        ? "inline-flex items-center gap-1 text-xs font-medium text-muted-foreground"
                        : "inline-flex items-center gap-1 text-xs font-medium text-destructive"
                  }
                >
                  {payment.status === "succeeded" ? (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  ) : payment.status === "pending" ? (
                    <Clock className="h-3.5 w-3.5" />
                  ) : (
                    <CreditCard className="h-3.5 w-3.5" />
                  )}
                  {statusLabel[payment.status] ?? payment.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
