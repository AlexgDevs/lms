import { createFileRoute } from "@tanstack/react-router"
import { RootPage } from "@/features/dashboard/pages/RootPage";

export const Route = createFileRoute("/_layout/")({
    component: RootPage,
    head: () => ({
        meta: [
            { title: "PLECTIX LMS — Главная" },
            { name: "description", content: "Добро пожаловать в PLECTIX — платформу онлайн-обучения с ИИ-курсами и интерактивными уроками." },
            { property: "og:title", content: "PLECTIX LMS — Главная" },
            { property: "og:description", content: "Платформа онлайн-обучения с ИИ-курсами и интерактивными уроками." },
        ],
    }),
})