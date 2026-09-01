import { ArrowRight, CreditCard, Loader2 } from "lucide-react"
import { useNavigate } from "@tanstack/react-router"
import { Card, CardContent } from "@/components/ui/card"
import { useMyPayments } from "@/features/payment/api/usePayments"
import { PaymentListItem } from "@/features/payment/components/PaymentListItem"
import { ROUTES } from "@/routes"

const PREVIEW_LIMIT = 5

export function PurchasesSection() {
  const navigate = useNavigate()
  const { data, isLoading } = useMyPayments()
  const payments = data ?? []
  const preview = payments.slice(0, PREVIEW_LIMIT)
  const hasMore = payments.length > PREVIEW_LIMIT

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
            {preview.map((payment) => (
              <PaymentListItem key={payment.id} payment={payment} />
            ))}

            {hasMore && (
              <button
                type="button"
                onClick={() => navigate({ to: ROUTES.PAYMENTS })}
                className="flex items-center text-xs text-muted-foreground hover:text-primary transition-colors cursor-pointer pt-1"
              >
                Все покупки <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
