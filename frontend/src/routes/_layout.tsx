import { createFileRoute, redirect } from "@tanstack/react-router";
import { isLoggedIn } from "@/features/auth/api/useAuth";
import { ROUTES } from "@/routes.ts";
import { Layout } from "@/components/layout/Layout";

const PUBLIC_ROUTES = [ROUTES.DASHBOARD, "/about", ROUTES.CATALOG];

export const Route = createFileRoute("/_layout")({
  beforeLoad: ({ location }) => {
    // Если страница НЕ публичная и юзер НЕ залогинен — отправляем на логин
    const isPublicRoute =
      PUBLIC_ROUTES.includes(location.pathname) ||
      location.pathname.startsWith(`${ROUTES.COURSE_DETAIL}/`);
    if (!isPublicRoute && !isLoggedIn()) {
      throw redirect({ to: ROUTES.LOGIN });
    }
  },
  component: Layout,
});
