import { createFileRoute } from "@tanstack/react-router";
import { SignupPage } from "@/features/auth/pages/SignupPage";
import { redirectIfAuthenticated } from "@/features/auth/api/useAuth";

export const Route = createFileRoute("/signup")({
    beforeLoad: redirectIfAuthenticated,
    component: () => <SignupPage />,
    head: () => ({
        meta: [
            { title: "Регистрация — PLECTIX LMS" },
            { name: "description", content: "Создайте аккаунт в PLECTIX и начните обучение прямо сейчас." },
        ],
    }),
})