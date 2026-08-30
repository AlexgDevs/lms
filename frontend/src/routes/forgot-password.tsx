import { createFileRoute } from "@tanstack/react-router"
import { ForgotPasswordPage } from "@/features/auth/pages/ForgotPasswordPage"
import { redirectIfAuthenticated } from "@/features/auth/api/useAuth"

export const Route = createFileRoute("/forgot-password")({
    beforeLoad: redirectIfAuthenticated,
    component: () => <ForgotPasswordPage />,
})
