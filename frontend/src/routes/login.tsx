import { createFileRoute } from "@tanstack/react-router";
import { LoginPage } from "@/features/auth/pages/LoginPage";

export const Route = createFileRoute("/login")({
    component: () => <LoginPage />,
    head: () => ({
        meta: [
            { title: "Вход — PLECTIX LMS" },
            { name: "description", content: "Войдите в свой аккаунт PLECTIX для продолжения обучения." },
        ],
    }),
})