import { createFileRoute } from "@tanstack/react-router"
import { PrivacyPolicyPage } from "@/features/legal/pages/PrivacyPolicyPage"

export const Route = createFileRoute("/_layout/privacy")({
  component: PrivacyPolicyPage,
})
