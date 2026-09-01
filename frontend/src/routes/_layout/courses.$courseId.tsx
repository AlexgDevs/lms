import { createFileRoute } from "@tanstack/react-router";
import { CoursePage } from "@/features/dashboard/pages/CoursePage";

export const Route = createFileRoute("/_layout/courses/$courseId")({
  component: CoursePage,
  head: () => ({
    meta: [
      { title: "Курс — PLECTIX LMS" },
      { name: "description", content: "Подробная информация о курсе на платформе PLECTIX." },
      { property: "og:title", content: "Курс — PLECTIX LMS" },
    ],
  }),
});
