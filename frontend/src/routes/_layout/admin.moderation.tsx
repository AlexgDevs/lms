import { createFileRoute } from "@tanstack/react-router"
import { ModerationPage } from "@/features/admin/pages/ModerationPage"

export const Route = createFileRoute("/_layout/admin/moderation")({
  component: () => <ModerationPage />,
})