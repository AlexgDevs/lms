import { createFileRoute } from "@tanstack/react-router";
import { LearnRedirectPage } from "@/features/learner/pages/LearnRedirectPage";

export const Route = createFileRoute("/_layout/learn/$courseId/")({
  component: LearnRedirectPage,
});