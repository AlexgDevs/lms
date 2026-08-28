import { createFileRoute } from "@tanstack/react-router"
import { MockPaymentPage } from "@/features/payment/pages/MockPaymentPage"

export const Route = createFileRoute("/mock-payment")({
  component: MockPaymentPage,
  validateSearch: (search: Record<string, unknown>) => ({
    qr: typeof search.qr === "string" ? search.qr === "1" : undefined,
    provider_id:
      typeof search.provider_id === "string" ? search.provider_id : undefined,
    course_id: typeof search.course_id === "string" ? search.course_id : undefined,
  }),
})
