export function Footer() {
  return (
    <footer className="w-full border-t border-border bg-card text-card-foreground py-6 px-6 shrink-0 transition-colors">
      <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
        {/* Копирайт */}
        <p>© {new Date().getFullYear()} PLECTIX LMS. Все права защищены.</p>

        {/* Навигационные ссылки подвала */}
        <div className="flex items-center gap-6 text-xs">
          <a
            href="#"
            className="hover:text-foreground transition-colors"
          >
            Помощь
          </a>
          <a
            href="#"
            className="hover:text-foreground transition-colors"
          >
            Условия использования
          </a>
          <a
            href="#"
            className="hover:text-foreground transition-colors"
          >
            Конфиденциальность
          </a>
        </div>
      </div>
    </footer>
  );
}