import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { isLoggedIn } from "@/hooks/useAuth";
import { ROUTES } from "@/routes.ts";
import { Header } from "@/components/sidebars/Header";
import { Footer } from "@/components/sidebars/Footer";

export const Route = createFileRoute("/_layout")({
  beforeLoad: () => {
    if (!isLoggedIn()) {
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