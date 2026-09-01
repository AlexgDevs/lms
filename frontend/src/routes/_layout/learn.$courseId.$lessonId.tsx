import { createFileRoute } from "@tanstack/react-router";
import { LearnPage } from "@/features/learner/pages/LearnPage";

export const Route = createFileRoute("/_layout/learn/$courseId/$lessonId")({
  component: LearnPage,
});