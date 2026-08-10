import { createFileRoute } from "@tanstack/react-router"
import { RootPage } from "@/features/dashboard/pages/RootPage";

export const Route = createFileRoute("/_layout/")({
    component: RootPage,
})