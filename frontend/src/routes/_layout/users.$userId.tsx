import { createFileRoute } from "@tanstack/react-router"
import { UserProfilePage } from "@/features/profile/pages/UserProfilePage"

export const Route = createFileRoute("/_layout/users/$userId")({
  component: UserProfilePage,
  head: () => ({
    meta: [
      { title: "Профиль — PLECTIX LMS" },
      { name: "description", content: "Публичный профиль пользователя PLECTIX." },
      { property: "og:title", content: "Профиль — PLECTIX LMS" },
    ],
  }),
})
