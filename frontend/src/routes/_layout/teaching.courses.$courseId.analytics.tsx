import { createFileRoute } from "@tanstack/react-router"
import { CourseAnalyticsPage } from "@/features/teaching/pages/CourseAnalyticsPage"

export const Route = createFileRoute(
  "/_layout/teaching/courses/$courseId/analytics"
)({
  component: CourseAnalyticsPage,
})
