import { useCallback, useState } from "react"
import { useNavigate } from "@tanstack/react-router"
import {
  ArrowRight,
  BookOpen,
  ChevronDown,
  Layers,
  ListChecks,
  Rocket,
  Sparkles,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { SnapSection } from "@/components/sections/SnapSection"
import { useInView } from "@/lib/useInView"
import { IRBIS_SPRITE } from "@/lib/irbisSprite"
import { ROUTES } from "@/routes"
import { cn } from "@/lib/utils"
import { BlockTypesExplorer } from "@/features/teaching/components/guide/BlockTypesExplorer"

const SECTION_IDS = [
  "guide-hero",
  "guide-steps",
  "guide-ai",
  "guide-blocks",
  "guide-cta",
] as const

/** Высота секции = вьюпорт минус хедер (`h-16` = 4rem). */
const SECTION_HEIGHT = "min-h-[calc(100dvh-4rem)]"

const STEPS = [
  {
    number: "01",
    icon: BookOpen,
    title: "Создайте курс",
    text: "Укажите название, описание, цену и категорию. Курс появится как черновик — его видите только вы.",
  },
  {
    number: "02",
    icon: Layers,
    title: "Наполните контент",
    text: "Модули → уроки → блоки: текст, квизы, код и медиа. Или дайте AI Copilot сгенерировать структуру.",
  },
  {
    number: "03",
    icon: ListChecks,
    title: "Отправьте на модерацию",
    text: "AI проверит содержимое, при необходимости подключится ручная проверка модератором.",
  },
  {
    number: "04",
    icon: Rocket,
    title: "Опубликуйте",
    text: "Одобренный курс попадёт в каталог и ленту рекомендаций — к нему сразу придут студенты.",
  },
] as const

export function CourseCreationGuidePage() {
  const navigate = useNavigate()
  const [activeIndex, setActiveIndex] = useState(0)

  const handleActive = useCallback((index: number) => setActiveIndex(index), [])

  const goCreate = () => navigate({ to: ROUTES.TEACHING })
  const goCatalog = () => navigate({ to: ROUTES.CATALOG })

  const scrollToSection = (index: number) => {
    document.getElementById(SECTION_IDS[index])?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    })
  }

  return (
    <div className="h-[calc(100dvh-4rem)] snap-y snap-mandatory overflow-y-auto bg-background text-foreground">
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

      {/* 1. HERO — приветствие и зачем создавать курсы */}
      <SnapSection
        id={SECTION_IDS[0]}
        index={0}
        onActive={handleActive}
        className={SECTION_HEIGHT}
        watermark="STUDIO"
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
            Студия преподавателя
          </span>

          <h1 className="text-4xl font-extrabold leading-[1.05] tracking-tight text-foreground sm:text-6xl">
            Как создавать курсы на Plectix
          </h1>

          <div className="space-y-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
            <p>
              Учите тому, что хорошо знаете: курс превращает вашу экспертизу в доход
              и помогает тысячам студентов достигать целей — от карьеры до хобби.
            </p>
            <p>
              Соберите курс из модулей, уроков и интерактивных блоков — текст, квизы,
              код и медиа. AI Copilot подготовит черновик структуры, автопроверка
              оценит задания студентов, а сертификат закрепит их результат.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Button
              size="lg"
              onClick={goCreate}
              className="shadow-[var(--shadow-glow-primary)] active:scale-95"
            >
              Начать создавать
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" onClick={goCatalog}>
              Посмотреть каталог
            </Button>
          </div>
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

      {/* 2. ЧЕТЫРЕ ШАГА — интерактивное появление */}
      <SnapSection
        id={SECTION_IDS[1]}
        index={1}
        onActive={handleActive}
        className={SECTION_HEIGHT}
        watermark="01"
      >
        <StepsContent />
      </SnapSection>

      {/* 3. AI-ГЕНЕРАЦИЯ — пробная генерация и время */}
      <SnapSection
        id={SECTION_IDS[2]}
        index={2}
        onActive={handleActive}
        className={SECTION_HEIGHT}
        watermark="02"
      >
        <AiContent />
      </SnapSection>

      {/* 4. ТИПЫ БЛОКОВ — интерактивный эксплорер */}
      <SnapSection
        id={SECTION_IDS[3]}
        index={3}
        onActive={handleActive}
        className={SECTION_HEIGHT}
        watermark="03"
      >
        <BlocksContent />
      </SnapSection>

      {/* 5. CTA — начать создавать */}
      <SnapSection
        id={SECTION_IDS[4]}
        index={4}
        onActive={handleActive}
        className={SECTION_HEIGHT}
        watermark="04"
      >
        <CtaContent goCreate={goCreate} />
      </SnapSection>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* 2. Четыре шага                                                      */
/* ------------------------------------------------------------------ */

function StepsContent() {
  const { ref, inView } = useInView<HTMLDivElement>(0.3)

  return (
    <div ref={ref} className="relative z-10 w-full max-w-4xl space-y-8">
      <div className="space-y-2">
        <span className="inline-flex items-center rounded-full border border-border/60 bg-card/60 px-3 py-1 font-mono text-[11px] font-semibold uppercase tracking-widest text-muted-foreground backdrop-blur">
          Как это работает
        </span>
        <h2 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          От идеи до публикации — 4 шага
        </h2>
        <p className="text-sm text-muted-foreground">
          Каждый шаг простой, а на выходе — готовый курс в каталоге.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((step, index) => {
          const Icon = step.icon
          return (
            <div
              key={step.number}
              className={cn(
                "group space-y-3 rounded-2xl bg-card p-5 text-left shadow-[var(--shadow-card)]",
                "opacity-0 translate-y-5 transition-all duration-500 ease-out",
                inView && "opacity-100 translate-y-0",
              )}
              style={{ transitionDelay: inView ? `${index * 150}ms` : "0ms" }}
            >
              <div className="flex items-center justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary transition-transform duration-300 group-hover:scale-110">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="font-mono text-xs font-bold tracking-widest text-muted-foreground/50">
                  {step.number}
                </span>
              </div>
              <h3 className="text-sm font-bold text-foreground">{step.title}</h3>
              <p className="text-xs leading-relaxed text-muted-foreground">{step.text}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* 3. AI-генерация                                                     */
/* ------------------------------------------------------------------ */

function AiContent() {
  const { ref, inView } = useInView<HTMLDivElement>(0.3)

  return (
    <div ref={ref} className="relative z-10 w-full max-w-2xl space-y-8">
      <div
        className={cn(
          "space-y-2",
          "opacity-0 translate-y-5 transition-all duration-500 ease-out",
          inView && "opacity-100 translate-y-0",
        )}
      >
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card/60 px-3 py-1 font-mono text-[11px] font-semibold uppercase tracking-widest text-muted-foreground backdrop-blur">
          <Sparkles className="h-3 w-3 text-reward" />
          AI Copilot
        </span>
        <h2 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          Сгенерируйте курс за пару минут
        </h2>
      </div>

      <div
        className={cn(
          "grid gap-4 sm:grid-cols-2",
          "opacity-0 translate-y-5 transition-all duration-500 ease-out",
          inView && "opacity-100 translate-y-0",
        )}
        style={{ transitionDelay: inView ? "150ms" : "0ms" }}
      >
        <div className="space-y-2 rounded-2xl bg-card p-5 text-left shadow-[var(--shadow-card)]">
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-5xl font-black tracking-tight text-foreground">
              1
            </span>
            <span className="text-xs text-muted-foreground">генерация</span>
          </div>
          <p className="text-xs text-muted-foreground">Пробная — бесплатно каждому автору</p>
          <span className="inline-flex items-center rounded-full bg-success/10 px-2.5 py-0.5 text-[11px] font-semibold text-success">
            0 ₽
          </span>
        </div>
        <div className="space-y-2 rounded-2xl bg-card p-5 text-left shadow-[var(--shadow-card)]">
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-5xl font-black tracking-tight text-foreground">
              2–10
            </span>
            <span className="text-xs text-muted-foreground">минут</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Время генерации — зависит от размера курса
          </p>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
            </span>
            В среднем 2 минуты
          </span>
        </div>
      </div>

      <div
        className={cn(
          "space-y-4",
          "opacity-0 translate-y-5 transition-all duration-500 ease-out",
          inView && "opacity-100 translate-y-0",
        )}
        style={{ transitionDelay: inView ? "300ms" : "0ms" }}
      >
        <p className="mx-auto max-w-lg text-sm leading-relaxed text-muted-foreground">
          Введите тему курса — AI соберёт структуру модулей, уроков и тестов.
          Каждому автору доступна{" "}
          <span className="font-semibold text-foreground">1 пробная генерация</span>,
          результат появится в конструкторе через 2–10 минут.
        </p>

        {/* Интерактивная полоса «генерации» (декоративная) */}
        <div aria-hidden className="mx-auto max-w-md space-y-2">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full w-2/3 animate-pulse rounded-full bg-gradient-to-r from-primary/50 via-primary to-primary/50" />
          </div>
          <p className="text-center font-mono text-[11px] text-muted-foreground/80">
            Генерируем структуру курса…
          </p>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* 4. Типы блоков                                                      */
/* ------------------------------------------------------------------ */

function BlocksContent() {
  const { ref, inView } = useInView<HTMLDivElement>(0.2)

  return (
    <div
      ref={ref}
      className={cn(
        "relative z-10 flex w-full max-w-3xl flex-col items-center space-y-6",
        "opacity-0 translate-y-5 transition-all duration-500 ease-out",
        inView && "opacity-100 translate-y-0",
      )}
    >
      <div className="space-y-2">
        <span className="inline-flex items-center rounded-full border border-border/60 bg-card/60 px-3 py-1 font-mono text-[11px] font-semibold uppercase tracking-widest text-muted-foreground backdrop-blur">
          Конструктор уроков
        </span>
        <h2 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          8 типов блоков для любого контента
        </h2>
        <p className="text-sm text-muted-foreground">
          Кликните на тип слева — посмотрите, как он выглядит и где пригодится.
        </p>
      </div>

      <BlockTypesExplorer />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* 5. CTA                                                              */
/* ------------------------------------------------------------------ */

function CtaContent({ goCreate }: { goCreate: () => void }) {
  const { ref, inView } = useInView<HTMLDivElement>(0.3)

  return (
    <div ref={ref} className="relative z-10 w-full max-w-xl space-y-6">
      {/* atmosphere */}
      <div className="pointer-events-none absolute -left-20 -top-16 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 -right-20 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />

      <div
        className={cn(
          "relative z-10 space-y-3",
          "opacity-0 translate-y-5 transition-all duration-500 ease-out",
          inView && "opacity-100 translate-y-0",
        )}
      >
        <span className="inline-flex items-center rounded-full border border-border/60 bg-card/60 px-3 py-1 font-mono text-[11px] font-semibold uppercase tracking-widest text-muted-foreground backdrop-blur">
          Финальный шаг
        </span>
        <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-5xl">
          Готовы поделиться знаниями?
        </h2>
        <p className="mx-auto max-w-md text-sm leading-relaxed text-muted-foreground">
          Создайте первый курс и выведите его в каталог PLECTIX. Черновик
          сохраняется автоматически — вернуться к нему можно в любой момент.
        </p>
      </div>

      <div
        className={cn(
          "relative z-10 flex justify-center pt-2",
          "opacity-0 translate-y-5 transition-all duration-500 ease-out",
          inView && "opacity-100 translate-y-0",
        )}
        style={{ transitionDelay: inView ? "200ms" : "0ms" }}
      >
        {/* Пульсирующее кольцо */}
        <span
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 h-24 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/20 blur-2xl"
        />

        <span className="group relative overflow-hidden">
          <Button
            size="lg"
            onClick={goCreate}
            className="relative z-10 h-12 px-8 text-base shadow-[var(--shadow-glow-primary)] active:scale-95"
          >
            Начать создавать курс
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Button>
          {/* Блик по наведению */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 z-20 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full"
          />
        </span>
      </div>
    </div>
  )
}
