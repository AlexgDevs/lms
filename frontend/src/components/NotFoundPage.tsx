import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/Header";
import { ROUTES } from "@/routes";

export function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground antialiased selection:bg-primary/10">
      <Header />
      <main className="flex-1 w-full mx-auto max-w-7xl px-4 py-6 md:px-8">
        <div className="flex flex-col items-center justify-center text-center py-12 md:py-20">
          <div className="relative">
            <div className="absolute inset-0 -z-10 scale-125 bg-[radial-gradient(ellipse_at_center,rgba(14,116,144,0.15),transparent_65%)]" />
            <img
              src="/404_irbis.svg"
              alt="Снежный барс"
              className="h-60 md:h-72 lg:h-80 w-auto object-contain"
            />
          </div>

          <p className="mt-8 text-7xl md:text-8xl font-bold tracking-tight text-foreground leading-none">
            404
          </p>
          <h1 className="mt-4 text-xl md:text-2xl font-semibold text-foreground">
            Страница не найдена
          </h1>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            Похоже, ирбис утащил эту страницу в свой высокогорный туман.
            Вернитесь на главную — там всё на месте.
          </p>

          <Button asChild size="lg" className="mt-8">
            <Link to={ROUTES.DASHBOARD}>На главную</Link>
          </Button>
        </div>
      </main>
    </div>
  );
}