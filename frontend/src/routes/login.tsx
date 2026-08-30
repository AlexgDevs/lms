import { createFileRoute } from "@tanstack/react-router";
import { LoginPage } from "@/features/auth/pages/LoginPage";
import { redirectIfAuthenticated } from "@/features/auth/api/useAuth";

export const Route = createFileRoute("/login")({
    beforeLoad: redirectIfAuthenticated,
    component: () => <LoginPage />,
    head: () => ({
        meta: [
            { title: "Вход — PLECTIX LMS" },
            { name: "description", content: "Войдите в свой аккаунт PLECTIX для продолжения обучения." },
        ],
    }),
})