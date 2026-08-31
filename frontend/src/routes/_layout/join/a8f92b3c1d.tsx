import { createFileRoute } from "@tanstack/react-router"
import { FounderConditionsPage } from "@/features/legal/pages/FounderConditionsPage"

export const Route = createFileRoute("/_layout/join/a8f92b3c1d")({
  component: FounderConditionsPage,
  head: () => ({
    meta: [
      { name: "robots", content: "noindex, nofollow" },
      { title: "Авторы-Основатели — PLECTIX" },
    ],
  }),
})
