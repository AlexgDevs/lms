import { Link } from "@tanstack/react-router";
import { useLayout } from "@/context/LayoutContext";
import { useTheme } from "@/hooks/useTheme";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CategoryCatalog } from "@/components/layouts/CategoryCatalog"; // <-- Наш каталог
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search, Bell, Moon, Sun } from "lucide-react";
import useAuth from "@/hooks/useAuth";

export function Header() {
  const { header } = useLayout();
  const { theme, toggleTheme } = useTheme();
  const { user, isLoggedIn, logout } = useAuth();

  if (!header.visible) return null;

  return (
    <header className="sticky top-0 z-50 h-16 w-full border-b border-border bg-card/80 backdrop-blur-md px-4 md:px-8 flex items-center justify-between gap-4 shrink-0 transition-colors">
      
      {header.content ? (
        <div className="flex items-center gap-6 min-w-0 flex-1">
          {header.content}
        </div>
      ) : (
        <>
          {/* Левая часть: Логотип и навигация */}
          <div className="flex items-center gap-6">
            <Link
              to="/"
              className="flex items-center gap-2 font-bold text-xl text-foreground tracking-tight hover:opacity-90 transition-opacity"
            >
              <span className="text-2xl text-primary">♾️</span> PLECTIX
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

          {/* Центральная часть: Каталог категорий + Инпут поиска */}
          <div className="flex-1 max-w-lg hidden sm:flex items-center gap-2">
            {/* Кругляш-кнопка каталога */}
            <CategoryCatalog />

            {/* Поисковое окно */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Поиск курсов..."
                className="w-full pl-9 bg-background/50 border-border focus-visible:bg-background rounded-full text-sm"
              />
            </div>
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

        <Button
          variant="ghost"
          size="icon"
          className="rounded-full text-muted-foreground hover:text-foreground transition-colors cursor-pointer relative"
          aria-label="Уведомления"
        >
          <Bell size={18} />
          <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary" />
        </Button>

        {isLoggedIn && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center justify-center w-9 h-9 rounded-full bg-primary/10 text-primary font-semibold text-sm border border-primary/20 hover:ring-2 hover:ring-primary/30 transition-all cursor-pointer ml-1">
                {user?.username?.[0]?.toUpperCase() ?? "U"}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <div className="px-3 py-2">
                <p className="text-sm font-medium text-foreground">{user?.username}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="text-destructive cursor-pointer">
                Выйти
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

    </header>
  );
}