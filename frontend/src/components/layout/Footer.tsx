import { Link } from "@tanstack/react-router"
import { ROUTES } from "@/routes"

export function Footer() {
  return (
    <footer className="w-full bg-card text-card-foreground py-6 px-6 shrink-0 transition-colors">
      <div className="mx-auto max-w-7xl flex flex-col items-center justify-between gap-4 text-sm text-muted-foreground">
        {/* Копирайт */}
        <p>© {new Date().getFullYear()} PLECTIX LMS. Все права защищены.</p>

        {/* Реквизиты оператора (для проверки ЮKassa) */}
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs">
          <span>Оператор: Сметанин Алексей Михайлович</span>
          <span>ИНН 451103864409</span>
          <a href="mailto:asmetanin014@gmail.com" className="hover:text-foreground transition-colors">
            asmetanin014@gmail.com
          </a>
        </div>

        {/* Навигационные ссылки подвала */}
        <div className="flex items-center gap-6 text-xs">
          <Link
            to={ROUTES.TERMS}
            className="hover:text-foreground transition-colors"
          >
            Условия использования
          </Link>
          <Link
            to={ROUTES.PRIVACY}
            className="hover:text-foreground transition-colors"
          >
            Конфиденциальность
          </Link>
        </div>
      </div>
    </footer>
  );
}
