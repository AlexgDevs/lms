import { createFileRoute } from "@tanstack/react-router"
import { VerifyEmailPage } from "@/features/auth/pages/VerifyEmailPage"
import * as z from "zod"

const verifyEmailSearchSchema = z.object({
    token: z.string().optional(),
})

export const Route = createFileRoute("/verify-email")({
    validateSearch: verifyEmailSearchSchema,
    component: () => <VerifyEmailPage />,
})
