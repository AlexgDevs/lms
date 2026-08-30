import type { ReactNode } from "react"
import { useNavigate } from "@tanstack/react-router"
import {
  ArrowRight,
  Award,
  BookOpen,
  CheckCircle2,
  Coins,
  Gift,
  Layers,
  ListChecks,
  Rocket,
  Shield,
  Sparkles,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ROUTES } from "@/routes"
import { cn } from "@/lib/utils"

export function CourseCreationGuidePage() {
  const navigate = useNavigate()

  const goCreate = () => navigate({ to: ROUTES.TEACHING })
  const goCatalog = () => navigate({ to: ROUTES.CATALOG })

  return (
    <div className="space-y-16 py-6">
      {/* HERO */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-card via-card to-primary/10 px-6 py-14 sm:px-12 sm:py-16 shadow-[var(--shadow-glow-primary)]">
        <div className="pointer-events-none absolute -top-24 -right-24 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-24 h-72 w-72 rounded-full bg-reward/5 blur-3xl" />
        <div className="relative z-10 max-w-3xl space-y-5">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-reward/10 px-3 py-1 text-xs font-semibold text-reward">
            <Sparkles className="h-3.5 w-3.5" />
            Beta Founders · 0% комиссия в бете
          </span>
          <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-foreground sm:text-5xl">
            Создавайте свои курсы на Plectix
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            Поделитесь знаниями с тысячами студентов. Постройте курс из модулей,
            уроков и интерактивных блоков — с AI Copilot для черновика структуры
            и автоматической проверкой кода.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button size="lg" onClick={goCreate} className="shadow-[var(--shadow-glow-primary)] active:scale-95">
              <Rocket className="h-4 w-4" />
              Создать курс
            </Button>
            <Button size="lg" variant="outline" onClick={goCatalog}>
              Посмотреть каталог
            </Button>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="space-y-8">
        <div className="space-y-1.5">
          <h2 className="text-2xl font-bold text-foreground">Как это работает</h2>
          <p className="text-sm text-muted-foreground">
            От идеи до публикации — четыре шага.
          </p>
        </div>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <StepCard
            step="01"
            icon={<BookOpen className="h-5 w-5" />}
            title="Создайте курс"
            text="Укажите название, описание, цену и категорию. Курс появится как черновик."
          />
          <StepCard
            step="02"
            icon={<Layers className="h-5 w-5" />}
            title="Наполните контент"
            text="Модули → уроки → блоки: текст, квизы, код, медиа. Или дайте AI Copilot сгенерировать структуру."
          />
          <StepCard
            step="03"
            icon={<ListChecks className="h-5 w-5" />}
            title="Отправьте на модерацию"
            text="AI проверит содержимое, при необходимости — ручная проверка модератором."
          />
          <StepCard
            step="04"
            icon={<Rocket className="h-5 w-5" />}
            title="Опубликуйте"
            text="Одобренный курс попадает в каталог и ленту рекомендаций."
          />
        </div>
      </section>

      {/* BONUSES */}
      <section className="space-y-8">
        <div className="space-y-1.5">
          <h2 className="text-2xl font-bold text-foreground">Бонусы программы «Авторы-Основатели»</h2>
          <p className="text-sm text-muted-foreground">
            Опубликуйте курс, пока программа открыта, — и статус Основателя останется за вами навсегда.
          </p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <PerkCard
            icon={<Coins className="h-5 w-5" />}
            highlight
            title="0% комиссии в бете"
            text="Платформа в бете не берёт комиссию с продаж. Но выплаты авторам пока не производятся — средства идут на развитие платформы."
          />
          <PerkCard
            icon={<Shield className="h-5 w-5" />}
            title="Пожизненный статус Основателя"
            text="Статус выдаётся при публикации курса и остаётся за автором навсегда."
          />
          <PerkCard
            icon={<Award className="h-5 w-5" />}
            title="Комиссия 5% навсегда"
            text="После релиза стандартная комиссия — 10%, основатели платят только 5%."
          />
          <PerkCard
            icon={<Sparkles className="h-5 w-5" />}
            title="Приоритет в рекомендациях"
            text="Повышающий коэффициент в ленте на первые 12 месяцев после запуска."
          />
          <PerkCard
            icon={<Gift className="h-5 w-5" />}
            title="Кастом-лендинг"
            text="Команда платформы бесплатно сделает страницу продаж для вашего главного курса."
          />
          <PerkCard
            icon={<CheckCircle2 className="h-5 w-5" />}
            title="Вывод без порога и приоритет"
            text="Без минимального порога на вывод в первый год и прямой чат с основателями платформы."
          />
        </div>
      </section>

      {/* HONEST MONEY */}
      <Card className="rounded-2xl border-reward/30 bg-gradient-to-br from-reward/10 to-transparent">
        <CardContent className="p-6 sm:p-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-reward" />
              <h2 className="text-xl font-bold text-foreground">Честно про деньги</h2>
            </div>
            <div className="space-y-3 text-sm leading-relaxed text-foreground/90">
              <p>
                <strong>В бета-версии выплаты авторам с платных курсов не производятся.</strong>
                Все поступления от продаж идут на развитие платформы — продукта, который будет зарабатывать вам в будущем.
              </p>
              <p>
                Мы берём <strong>0% комиссии</strong>, но и <strong>не выводим</strong> деньги авторам:
                это осознанная инвестиция в разработку платформы на этапе запуска.
              </p>
              <p>
                <strong>После релиза</strong> включается стандартная модель: 10% комиссия платформе, авторы получают свою
                долю, а основатели — закреплённые 5% и привилегии. Автоматические выплаты появятся вместе с ней.
              </p>
            </div>
            <Button variant="outline" onClick={goCreate}>
              Стать автором-основателем <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* CTA */}
      <section className="rounded-3xl bg-card p-8 text-center shadow-[var(--shadow-card)]">
        <div className="mx-auto max-w-xl space-y-4">
          <h2 className="text-2xl font-bold text-foreground">Готовы поделиться знаниями?</h2>
          <p className="text-sm text-muted-foreground">
            Программа «Авторы-Основатели» закрывается, когда платформа достигнет 50 000 ₽ выручки <strong>и</strong> соберёт
            30 авторов. Успейте опубликовать первый курс и закрепить за собой статус.
          </p>
          <Button size="lg" onClick={goCreate} className="shadow-[var(--shadow-glow-primary)] active:scale-95">
            <Sparkles className="h-4 w-4" />
            Создать первый курс
          </Button>
        </div>
      </section>
    </div>
  )
}

function StepCard({
  step,
  icon,
  title,
  text,
}: {
  step: string
  icon: ReactNode
  title: string
  text: string
}) {
  return (
    <Card className="rounded-xl bg-card shadow-[var(--shadow-card)]">
      <CardContent className="flex h-full flex-col gap-3 p-5">
        <div className="flex items-center justify-between">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            {icon}
          </span>
          <span className="font-mono text-xs font-bold text-muted-foreground/50">{step}</span>
        </div>
        <h3 className="font-bold text-foreground">{title}</h3>
        <p className="text-xs leading-relaxed text-muted-foreground">{text}</p>
      </CardContent>
    </Card>
  )
}

function PerkCard({
  icon,
  title,
  text,
  highlight,
}: {
  icon: ReactNode
  title: string
  text: string
  highlight?: boolean
}) {
  return (
    <Card
      className={cn(
        "rounded-xl bg-card shadow-[var(--shadow-card)]",
        highlight && "border-reward/40 bg-gradient-to-br from-reward/10 to-transparent",
      )}
    >
      <CardContent className="flex gap-4 p-5">
        <span
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
            highlight ? "bg-reward/10 text-reward" : "bg-primary/10 text-primary",
          )}
        >
          {icon}
        </span>
        <div className="min-w-0 space-y-1">
          <h3 className="font-bold text-foreground">{title}</h3>
          <p className="text-xs leading-relaxed text-muted-foreground">{text}</p>
        </div>
      </CardContent>
    </Card>
  )
}
