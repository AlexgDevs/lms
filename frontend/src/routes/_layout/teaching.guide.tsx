import { createFileRoute } from "@tanstack/react-router"
import { CourseCreationGuidePage } from "@/features/teaching/pages/CourseCreationGuidePage"

export const Route = createFileRoute("/_layout/teaching/guide")({
  component: CourseCreationGuidePage,
})
