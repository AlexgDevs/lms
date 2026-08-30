import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useLayout } from "@/app/providers/useLayout";
import { useTheme } from "@/app/providers/useTheme";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CategoryCatalog } from "@/components/layout/CategoryCatalog";
import { MobileNav } from "@/components/layout/MobileNav";
import { NotificationsBell } from "@/features/notifications/components/NotificationsBell";
import { UserMenu } from "@/components/layout/UserMenu";
import { useNotificationSocket } from "@/features/notifications/api/useNotificationSocket";
import { ROUTES } from "@/routes";
import { Search, Moon, Sun } from "lucide-react";

export function Header() {
  const { header } = useLayout();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  useNotificationSocket();

  if (!header.visible) return null;

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = query.trim();
    navigate({
      to: ROUTES.CATALOG,
      search: trimmed ? { q: trimmed } : {},
    });
    setQuery("");
  };

  return (
    <header className="sticky top-0 z-50 h-16 w-full border-b border-border bg-card/80 backdrop-blur-md px-4 md:px-8 flex items-center justify-between gap-4 shrink-0 transition-colors">
      
      {header.content ? (
        <div className="flex items-center gap-6 min-w-0 flex-1">
          {header.content}
        </div>
      ) : (
        <>
          <div className="flex items-center gap-3">
            <MobileNav />
            <Link
              to="/"
              className="flex items-center gap-2 font-bold text-xl text-foreground tracking-tight hover:opacity-90 transition-opacity"
            >
              <img
                src={theme === "dark" ? "/full-logo-for-dark-theme.png" : "/full-logo.png"}
                alt="PLECTIX"
                className="h-8 w-auto"
              />
            </Link>

            <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
              <Link
                to="/"
                activeProps={{ className: "text-primary font-semibold" }}
                inactiveProps={{ className: "text-muted-foreground hover:text-foreground" }}
                className="transition-colors"
              >
                Моё обучение
              </Link>
              <Link
                to="/teaching"
                activeProps={{ className: "text-primary font-semibold" }}
                inactiveProps={{ className: "text-muted-foreground hover:text-foreground" }}
                className="transition-colors"
              >
                Преподавание
              </Link>
            </nav>
          </div>

          <div className="flex-1 max-w-lg hidden sm:flex items-center gap-2">
            <CategoryCatalog />

            <form role="search" onSubmit={handleSearchSubmit} className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Поиск курсов..."
                className="w-full pl-9 rounded-full text-sm focus-visible:bg-background"
              />
            </form>
          </div>
        </>
      )}

      {/* Правая часть */}
      <div className="flex items-center gap-2 shrink-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="rounded-full text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          aria-label="Переключить тему"
        >
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </Button>

        <NotificationsBell />

        {/* Вся логика авторизации и аватара тут */}
        <UserMenu />
      </div>

    </header>
  );
}