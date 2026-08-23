import { createFileRoute } from "@tanstack/react-router";
import { SignupPage } from "@/features/auth/pages/SignupPage";

export const Route = createFileRoute("/signup")({
    component: () => <SignupPage />,
    head: () => ({
        meta: [
            { title: "Регистрация — PLECTIX LMS" },
            { name: "description", content: "Создайте аккаунт в PLECTIX и начните обучение прямо сейчас." },
        ],
    }),
})