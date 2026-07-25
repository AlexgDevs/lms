import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { isLoggedIn } from "@/hooks/useAuth";
import { ROUTES } from "@/routes.ts";
import { Header } from "@/components/sidebars/Header";
import { Footer } from "@/components/sidebars/Footer";

const PUBLIC_ROUTES = [ROUTES.DASHBOARD, "/about", "/catalog"];

export const Route = createFileRoute("/_layout")({
  beforeLoad: ({ location }) => {
    // Если страница НЕ публичная и юзер НЕ залогинен — отправляем на логин
    if (!PUBLIC_ROUTES.includes(location.pathname) && !isLoggedIn()) {
      throw redirect({ to: ROUTES.LOGIN });
    }
  },
  component: LayoutComponent,
});

function LayoutComponent() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground antialiased selection:bg-primary/10">
      {/* 1. Наш единый Header с вызовом useLayout */}
      <Header />

      {/* 2. Основная область, куда рендерится текущая страница (через Outlet) */}
      <main className="flex-1 w-full mx-auto max-w-7xl px-4 py-6 md:px-8">
        <Outlet />
      </main>

      {/* 3. Подвал приложения */}
      <Footer />
    </div>
  );
}