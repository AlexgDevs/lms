import { useState } from "react"
import { useNavigate, useSearch } from "@tanstack/react-router"
import { CheckCircle2, CreditCard, Loader2, QrCode } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { PaymentService } from "@/client"
import { getErrorMessage } from "@/lib/errors"
import { showErrorToast, showSuccessToast } from "@/lib/toast"

export function MockPaymentPage() {
  const navigate = useNavigate()
  const search = useSearch({ from: "/mock-payment" })
  const [submitting, setSubmitting] = useState(false)

  const providerId = search.provider_id
  const courseId = search.course_id
  const qr = Boolean(search.qr)

  const simulateSuccess = async () => {
    if (!providerId) {
      showErrorToast("Не удалось определить платёж — отсутствует provider_id")
      return
    }
    setSubmitting(true)
    try {
      await PaymentService.yookassaWebhookApiV1PaymentsWebhookYookassaPost({
        body: {
          event: "payment.succeeded",
          type: "notification",
          object: { id: providerId, status: "succeeded" },
        },
      })
      showSuccessToast("Оплата получена, доступ к курсу открыт.")
      if (courseId) {
        navigate({
          to: "/courses/$courseId",
          params: { courseId },
        })
      }
    } catch (err) {
      showErrorToast(getErrorMessage(err) || "Не удалось симулировать оплату")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md rounded-xl shadow-[var(--shadow-card)]">
        <CardContent className="p-6">
          <h1 className="mb-1 flex items-center gap-2 text-lg font-bold text-foreground">
            {qr ? (
              <QrCode className="h-5 w-5 text-primary" />
            ) : (
              <CreditCard className="h-5 w-5 text-primary" />
            )}
            {qr ? "SBP: оплата по QR-коду" : "Дополнительные способы оплаты"}
          </h1>
          <p className="mb-5 text-sm text-muted-foreground">
            Это тестовая страница-заглушка платёжного провайдера (мок YooKassa).
            Она имитирует страницу оплаты: нажмите кнопку ниже, чтобы отправить
            вебхук <code>payment.succeeded</code> и открыть доступ к курсу.
          </p>

          {providerId ? (
            <div className="mb-5 space-y-2 rounded-lg bg-muted/40 px-3 py-2.5 text-xs">
              <p className="truncate text-muted-foreground">
                provider_id: <span className="text-foreground">{providerId}</span>
              </p>
              {courseId && (
                <p className="truncate text-muted-foreground">
                  course_id: <span className="text-foreground">{courseId}</span>
                </p>
              )}
            </div>
          ) : (
            <p className="mb-5 text-xs text-destructive">
              Отсутствует provider_id — перейдите на эту страницу через чекаут
              (кнопка «Оплатить» на странице курса).
            </p>
          )}

          <Button
            size="lg"
            className="w-full"
            disabled={!providerId || submitting}
            onClick={simulateSuccess}
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            {submitting ? "Отправка..." : "Симулировать успешную оплату"}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
