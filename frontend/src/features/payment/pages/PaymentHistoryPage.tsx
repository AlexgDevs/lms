import { ArrowLeft, CreditCard, Loader2 } from "lucide-react"
import { useNavigate } from "@tanstack/react-router"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useMyPayments } from "@/features/payment/api/usePayments"
import { PaymentListItem } from "@/features/payment/components/PaymentListItem"
import { ROUTES } from "@/routes"

export function PaymentHistoryPage() {
  const navigate = useNavigate()
  const { data, isLoading } = useMyPayments()
  const payments = data ?? []

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-2">
      <div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate({ to: ROUTES.PROFILE })}
          className="text-muted-foreground hover:text-foreground -ml-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Назад
        </Button>
        <h1 className="text-xl font-bold tracking-tight text-foreground">
          История платежей
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Ваши покупки и статусы оплат
        </p>
      </div>

      <Card className="rounded-xl shadow-[var(--shadow-card)]">
        <CardContent className="p-4">
          <h2 className="flex items-center gap-2 mb-3 font-bold text-sm text-foreground">
            <CreditCard className="h-4 w-4 text-primary" />
            Покупки
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
              {payments.map((payment) => (
                <PaymentListItem key={payment.id} payment={payment} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
