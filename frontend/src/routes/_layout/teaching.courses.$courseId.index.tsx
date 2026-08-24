import { createFileRoute } from "@tanstack/react-router"
import { CourseBuilderPage } from "@/features/teaching/pages/CourseBuilderPage"

export const Route = createFileRoute("/_layout/teaching/courses/$courseId/")({
  component: CourseBuilderPage,
})
