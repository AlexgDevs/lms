import { Outlet, useLocation } from "@tanstack/react-router";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { EmailVerificationBanner } from "@/components/layout/EmailVerificationBanner";
import { TermsUpdateBanner } from "@/components/layout/TermsUpdateBanner";
import { isFullBleedPath, ROUTES } from "@/routes";

export function Layout() {
  const { pathname } = useLocation();
  const fullBleed = isFullBleedPath(pathname);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground antialiased selection:bg-primary/10">
      {/* 1. Наш единый Header с вызовом useLayout */}
      <Header />

      {/* 1b. Баннер подтверждения почты */}
      <EmailVerificationBanner />

      {/* 2. Основная область, куда рендерится текущая страница (через Outlet).
          Полноэкранные маршруты (конструктор курса) управляют собственными отступами. */}
      <main
        className={
          fullBleed
            ? "flex-1 w-full"
            : "flex-1 w-full mx-auto max-w-7xl px-4 py-6 md:px-8"
        }
      >
        <Outlet />
      </main>

      {/* 3. Подвал приложения — только на главной странице */}
      {pathname === ROUTES.DASHBOARD && <Footer />}

      {/* 4. Плашка обновления лицензионного соглашения — левый нижний угол, для всех залогиненных */}
      <TermsUpdateBanner />
    </div>
  );
}
