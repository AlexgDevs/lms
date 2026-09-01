import type { ReactNode } from "react"
import { useNavigate } from "@tanstack/react-router"
import { BookOpen, Layers, ListChecks, Rocket } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ROUTES } from "@/routes"

export function CourseCreationGuidePage() {
  const navigate = useNavigate()

  const goCreate = () => navigate({ to: ROUTES.TEACHING })
  const goCatalog = () => navigate({ to: ROUTES.CATALOG })

  return (
    <div className="space-y-16 py-6">
      {/* HERO */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-card via-card to-primary/10 px-6 py-14 sm:px-12 sm:py-16 shadow-[var(--shadow-glow-primary)]">
        <div className="pointer-events-none absolute -top-24 -right-24 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative z-10 max-w-3xl space-y-5">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            Студия преподавателя
          </span>
          <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-foreground sm:text-5xl">
            Как создавать курсы на Plectix
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            Соберите курс из модулей, уроков и интерактивных блоков — текст, квизы, код и медиа.
            AI Copilot поможет сгенерировать черновик структуры, а автоматическая проверка кода
            проверит задания студентов.
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
          <p className="text-sm text-muted-foreground">От идеи до публикации — четыре шага.</p>
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

      {/* CTA */}
      <section className="rounded-3xl bg-card p-8 text-center shadow-[var(--shadow-card)]">
        <div className="mx-auto max-w-xl space-y-4">
          <h2 className="text-2xl font-bold text-foreground">Готовы поделиться знаниями?</h2>
          <p className="text-sm text-muted-foreground">Создайте первый курс и выведите его в каталог платформы.</p>
          <Button size="lg" onClick={goCreate} className="shadow-[var(--shadow-glow-primary)] active:scale-95">
            <Rocket className="h-4 w-4" />
            Создать первый курс
          </Button>
        </div>
      </section>
    </div>
  )
}

function StepCard({ step, icon, title, text }: { step: string; icon: ReactNode; title: string; text: string }) {
  return (
    <Card className="rounded-xl bg-card shadow-[var(--shadow-card)]">
      <CardContent className="flex h-full flex-col gap-3 p-5">
        <div className="flex items-center justify-between">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">{icon}</span>
          <span className="font-mono text-xs font-bold text-muted-foreground/50">{step}</span>
        </div>
        <h3 className="font-bold text-foreground">{title}</h3>
        <p className="text-xs leading-relaxed text-muted-foreground">{text}</p>
      </CardContent>
    </Card>
  )
}
