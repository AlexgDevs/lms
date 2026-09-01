import { Outlet } from "@tanstack/react-router";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { EmailVerificationBanner } from "@/components/layout/EmailVerificationBanner";

export function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground antialiased selection:bg-primary/10">
      {/* 1. Наш единый Header с вызовом useLayout */}
      <Header />

      {/* 1b. Баннер подтверждения почты */}
      <EmailVerificationBanner />

      {/* 2. Основная область, куда рендерится текущая страница (через Outlet) */}
      <main className="flex-1 w-full mx-auto max-w-7xl px-4 py-6 md:px-8">
        <Outlet />
      </main>

      {/* 3. Подвал приложения */}
      <Footer />
    </div>
  );
}
