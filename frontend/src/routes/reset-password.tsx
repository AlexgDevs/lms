import { createFileRoute } from "@tanstack/react-router"
import { ResetPasswordPage } from "@/features/auth/pages/ResetPasswordPage"
import * as z from "zod"

const resetPasswordSearchSchema = z.object({
    token: z.string(),
})

export const Route = createFileRoute("/reset-password")({
    validateSearch: resetPasswordSearchSchema,
    component: () => <ResetPasswordPage />,
})
