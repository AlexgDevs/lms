import { createFileRoute } from "@tanstack/react-router"
import { PaymentHistoryPage } from "@/features/payment/pages/PaymentHistoryPage"

export const Route = createFileRoute("/_layout/profile/payments")({
  component: () => <PaymentHistoryPage />,
})
