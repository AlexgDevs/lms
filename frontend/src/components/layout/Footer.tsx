import { Link } from "@tanstack/react-router"
import { ROUTES } from "@/routes"

const LINK_CLASS = "text-muted-foreground hover:text-foreground transition-colors"

export function Footer() {
  return (
    <footer className="w-full shrink-0 border-t border-border/60 bg-card text-card-foreground transition-colors">
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-8 lg:py-10">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {/* 1. Юридическая информация */}
          <div>
            <h3 className="mb-3 text-xs font-medium text-foreground/70">
              Юридическая информация
            </h3>
            <div className="space-y-2 text-xs text-muted-foreground">
              <p>© {new Date().getFullYear()} PLECTIX LMS. Все права защищены.</p>
              <p>Оператор: Сметанин Алексей Михайлович</p>
              <p>ИНН 451103864409</p>
              <div className="flex flex-col gap-2 pt-1">
                <Link to={ROUTES.PRIVACY} className={LINK_CLASS}>
                  Политика конфиденциальности
                </Link>
                <Link to={ROUTES.TERMS} className={LINK_CLASS}>
                  Пользовательское соглашение
                </Link>
              </div>
            </div>
          </div>

          {/* 2. Сообщество */}
          <div>
            <h3 className="mb-3 text-xs font-medium text-foreground/70">Сообщество</h3>
            <div className="flex flex-col gap-2 text-xs text-muted-foreground">
              <a
                href="https://t.me/plectix"
                target="_blank"
                rel="noopener noreferrer"
                className={LINK_CLASS}
              >
                Telegram-канал
              </a>
              <a
                href="https://vk.ru/club241692285"
                target="_blank"
                rel="noopener noreferrer"
                className={LINK_CLASS}
              >
                Группа ВКонтакте
              </a>
            </div>
          </div>

          {/* 3. Поддержка */}
          <div>
            <h3 className="mb-3 text-xs font-medium text-foreground/70">Поддержка</h3>
            <a href="mailto:asmetanin014@gmail.com" className={LINK_CLASS}>
              asmetanin014@gmail.com
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
