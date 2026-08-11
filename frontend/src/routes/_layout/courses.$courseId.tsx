import { createFileRoute } from "@tanstack/react-router";
import { CoursePage } from "@/features/dashboard/pages/CoursePage";

export const Route = createFileRoute("/_layout/courses/$courseId")({
  component: CoursePage,
});
