import { useCallback, useState } from "react"
import { Link, useNavigate } from "@tanstack/react-router"
import { ArrowRight, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ROUTES } from "@/routes"
import { cn } from "@/lib/utils"
import { formatPrice } from "@/lib/price"
import { IRBIS_SPRITE } from "@/lib/irbisSprite"
import { useFounderProgress } from "@/features/legal/api/useFounderProgress"
import { SnapSection } from "@/components/sections/SnapSection"
import { FounderSeatGrid } from "@/features/legal/components/founder/FounderSeatGrid"
import { CountUp } from "@/features/legal/components/founder/CountUp"
import { FounderBonusItem } from "@/features/legal/components/founder/FounderBonusItem"

const SECTION_IDS = [
  "founder-hero",
  "founder-condition-1",
  "founder-condition-2",
  "founder-bonuses",
] as const

const PROGRESS_FALLBACK = {
  founders_count: 0,
  max_authors: 30,
  revenue: 0,
  revenue_limit: 15_000_000,
}

const BONUSES = [
  {
    number: "01",
    title: "Комиссия 5% навсегда",
    text: "После релиза обычные авторы будут платить комиссию 10%. Для вас она зафиксирована на уровне 5% пожизненно. На больших оборотах вы будете в огромном плюсе.",
  },
  {
    number: "02",
    title: "Буст ×3 в поиске",
    text: "Ваши курсы получат повышенный коэффициент видимости в каталоге и рекомендациях PLECTIX на первые 6 месяцев после релиза. Это обеспечит вам бесплатный поток первых учеников.",
  },
  {
    number: "03",
    title: "Прямой доступ к разработчику",
    text: "Закрытый Telegram-чат со сквозным бэклогом. Вы сможете напрямую советовать, как улучшить платформу для вашего же удобства, а ваши фидбеки и предложения будут иметь наивысший приоритет.",
  },
  {
    number: "04",
    title: "Вечный статус",
    text: "Эксклюзивный именной бейдж «Основатель» в вашем профиле автора и в личных кабинетах ваших студентов. Знак того, что вы помогли проекту на самом старте.",
  },
] as const

export function FounderConditionsPage() {
  const navigate = useNavigate()
  const [activeIndex, setActiveIndex] = useState(0)
  const { data } = useFounderProgress()
  const progress = data ?? PROGRESS_FALLBACK

  const handleActive = useCallback((index: number) => setActiveIndex(index), [])

  const scrollToSection = (index: number) => {
    document.getElementById(SECTION_IDS[index])?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    })
  }

  const goCreate = () => navigate({ to: ROUTES.TEACHING })

  return (
    <div className="relative h-dvh snap-y snap-mandatory overflow-y-auto bg-background text-foreground">
      {/* Dot navigation */}
      <nav
        aria-label="Навигация по разделам"
        className="fixed right-4 top-1/2 z-50 flex -translate-y-1/2 flex-col gap-3"
      >
        {SECTION_IDS.map((id, i) => (
          <button
            key={id}
            type="button"
            aria-label={`Перейти к разделу ${i + 1}`}
            onClick={() => scrollToSection(i)}
            className={cn(
              "h-2.5 w-2.5 rounded-full transition-colors duration-300",
              activeIndex === i
                ? "bg-foreground shadow-[0_0_8px_var(--color-foreground)]"
                : "bg-muted-foreground/30 hover:bg-muted-foreground/60",
            )}
          />
        ))}
      </nav>

      {/* 1. HERO — акция */}
      <SnapSection
        id={SECTION_IDS[0]}
        index={0}
        onActive={handleActive}
        className="h-dvh"
        watermark="FOUNDERS"
        watermarkClassName="text-[13vw] tracking-tight"
      >
        {/* atmosphere */}
        <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -right-16 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />

        <div className="relative z-10 max-w-3xl space-y-6">
          <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/60 px-3 py-1 font-mono text-[11px] font-semibold uppercase tracking-widest text-muted-foreground backdrop-blur">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-foreground opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-foreground" />
            </span>
            Beta · п. 2.2
          </span>

          <h1 className="text-4xl font-extrabold leading-[1.05] tracking-tight text-foreground sm:text-6xl">
            Станьте Преподавателем-Основателем
          </h1>

          <div className="space-y-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
            <p>
              Сейчас PLECTIX находится в стадии активного бета-теста. Согласно{" "}
              <Link
                to={ROUTES.TERMS}
                className="font-medium text-foreground underline underline-offset-4 hover:text-foreground/70"
              >
                п. 2.2 нашего Соглашения
              </Link>
              , все 100% средств от первых продаж ваших курсов идут напрямую на
              оплату серверов, мощностей искусственного интеллекта и налоги
              платформы.
            </p>
            <p>
              Вы инвестируете свои первые продажи в развитие системы, а мы взамен
              навсегда закрепляем за вами статус Преподавателя-Основателя и
              эксклюзивные условия, которых больше не будет ни у кого.
            </p>
          </div>

          <Button
            size="lg"
            onClick={goCreate}
            className="shadow-[var(--shadow-glow-primary)] active:scale-95"
          >
            Стать автором-основателем
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Irbis eye above the scroll hint */}
        <div className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-2">
          <img
            src={IRBIS_SPRITE}
            alt=""
            aria-hidden
            draggable={false}
            className="h-16 w-auto select-none animate-irbis-bob object-contain drop-shadow-md sm:h-20"
          />
          <ChevronDown className="h-5 w-5 animate-bounce text-muted-foreground" />
        </div>
      </SnapSection>

      {/* 2. УСЛОВИЕ 1 — места основателей */}
      <SnapSection
        id={SECTION_IDS[1]}
        index={1}
        onActive={handleActive}
        className="h-dvh"
        watermark="01"
      >
        <div className="relative z-10 w-full max-w-2xl space-y-8">
          <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            Условие 1 из 2
          </span>

          <div className="flex items-baseline justify-center gap-3">
            <CountUp
              value={progress.founders_count}
              className="text-6xl font-black tracking-tight text-foreground font-mono sm:text-7xl"
            />
            <span className="text-xl font-bold text-muted-foreground sm:text-2xl">
              из {progress.max_authors}
            </span>
          </div>

          <FounderSeatGrid
            value={progress.founders_count}
            max={progress.max_authors}
          />

          <p className="mx-auto max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">
            В системе опубликуют курсы и сделают хотя бы по одной продаже{" "}
            <span className="font-semibold text-foreground">
              {progress.max_authors} авторов
            </span>
            . Каждое свободное место — ваш шанс войти в число основателей.
          </p>
        </div>
      </SnapSection>

      {/* 3. УСЛОВИЕ 2 — оборот */}
      <SnapSection
        id={SECTION_IDS[2]}
        index={2}
        onActive={handleActive}
        className="h-dvh"
        watermark="02"
      >
        <div className="relative z-10 w-full max-w-2xl space-y-8">
          <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            Условие 2 из 2
          </span>

          <div className="flex flex-wrap items-baseline justify-center gap-3">
            <CountUp
              value={progress.revenue}
              format={(n) => `${formatPrice(n)} ₽`}
              className="text-5xl font-black tracking-tight text-foreground font-mono sm:text-7xl"
            />
            <span className="text-xl font-bold text-muted-foreground sm:text-2xl">
              из {formatPrice(progress.revenue_limit)} ₽
            </span>
          </div>

          <p className="mx-auto max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">
            Суммарный оборот платформы достигнет{" "}
            <span className="font-semibold text-foreground">
              {formatPrice(progress.revenue_limit)} ₽
            </span>
            .
          </p>
        </div>
      </SnapSection>

      {/* 4. БОНУСЫ после беты */}
      <SnapSection
        id={SECTION_IDS[3]}
        index={3}
        onActive={handleActive}
        watermark="03"
      >
        <div className="relative z-10 w-full max-w-3xl space-y-8">
          <div className="space-y-2">
            <span className="inline-flex items-center rounded-full border border-border/60 bg-card/60 px-3 py-1 font-mono text-[11px] font-semibold uppercase tracking-widest text-muted-foreground backdrop-blur">
              После бета-тестирования
            </span>
            <h2 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-4xl">
              Что вы получите
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {BONUSES.map((bonus, i) => (
              <FounderBonusItem key={bonus.number} index={i} {...bonus} />
            ))}
          </div>

          <Button
            size="lg"
            onClick={goCreate}
            className="shadow-[var(--shadow-glow-primary)] active:scale-95"
          >
            Создать первый курс
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </SnapSection>
    </div>
  )
}
