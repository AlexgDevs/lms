import type { ReactNode } from "react"
import { useNavigate } from "@tanstack/react-router"
import { ArrowRight, Award, CheckCircle2, Coins, Gift, Shield, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ROUTES } from "@/routes"
import { cn } from "@/lib/utils"

export function FounderConditionsPage() {
  const navigate = useNavigate()

  const goCreate = () => navigate({ to: ROUTES.TEACHING })

  return (
    <div className="space-y-16 py-6">
      {/* HERO */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-card via-card to-reward/10 px-6 py-14 sm:px-12 sm:py-16 shadow-[var(--shadow-glow-reward)]">
        <div className="pointer-events-none absolute -top-24 -right-24 h-80 w-80 rounded-full bg-reward/10 blur-3xl" />
        <div className="relative z-10 max-w-3xl space-y-5">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-reward/10 px-3 py-1 text-xs font-semibold text-reward">
            <Sparkles className="h-3.5 w-3.5" />
            Программа «Авторы-Основатели»
          </span>
          <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-foreground sm:text-5xl">
            Станьте основателем платформы
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            Опубликуйте курс, пока программа открыта, и закрепите за собой статус Основателя
            и бизнес-привилегии навсегда.
          </p>
        </div>
      </section>

      {/* BONUSES */}
      <section className="space-y-8">
        <div className="space-y-1.5">
          <h2 className="text-2xl font-bold text-foreground">Привилегии Основателя</h2>
          <p className="text-sm text-muted-foreground">Статус присваивается при публикации курса.</p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <PerkCard icon={<Coins className="h-5 w-5" />} highlight title="0% комиссии в бете"
            text="Пока платформа в бете, она не берёт комиссии с продаж — но выплаты авторам пока не производятся." />
          <PerkCard icon={<Shield className="h-5 w-5" />} title="Пожизненный статус Основателя"
            text="Статус выдаётся при публикации курса и остаётся за автором навсегда." />
          <PerkCard icon={<Award className="h-5 w-5" />} title="Комиссия 5% навсегда"
            text="После релиза стандартная комиссия — 10%, основатели платят только 5%." />
          <PerkCard icon={<Sparkles className="h-5 w-5" />} title="Приоритет в рекомендациях"
            text="Повышающий коэффициент в ленте на первые 12 месяцев после запуска." />
          <PerkCard icon={<Gift className="h-5 w-5" />} title="Кастом-лендинг"
            text="Команда платформы бесплатно сделает страницу продаж для вашего главного курса." />
          <PerkCard icon={<CheckCircle2 className="h-5 w-5" />} title="Вывод без порога и приоритет"
            text="Без минимального порога на вывод в первый год и прямой чат с основателями платформы." />
        </div>
      </section>

      {/* ЧЕСТНО ПРО ДЕНЬГИ */}
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
                Все поступления от продаж идут на развитие платформы — продукта, который будет
                зарабатывать вам в будущем.
              </p>
              <p>
                Мы берём <strong>0% комиссии</strong>, но и <strong>не выводим</strong> деньги
                авторам: это осознанная инвестиция в разработку платформы на этапе запуска.
              </p>
              <p>
                <strong>После релиза</strong> включается стандартная модель: 10% комиссия платформе,
                авторы получают свою долю, а основатели — закреплённые 5% и привилегии. Автоматические
                выплаты появятся вместе с ней.
              </p>
            </div>
            <Button variant="outline" onClick={goCreate}>
              Стать автором-основателем <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* УСЛОВИЯ ЗАКРЫТИЯ */}
      <section className="rounded-3xl bg-card p-8 text-center shadow-[var(--shadow-card)]">
        <div className="mx-auto max-w-xl space-y-4">
          <h2 className="text-2xl font-bold text-foreground">Когда программа закрывается</h2>
          <p className="text-sm text-muted-foreground">
            Программа «Авторы-Основатели» действует до момента, когда будут выполнены
            оба условия: платформа достигнет 50 000 ₽ выручки и статус получат 30 авторов.
            Успейте опубликовать первый курс — статус останется за вами навсегда.
          </p>
          <Button size="lg" onClick={goCreate} className="shadow-[var(--shadow-glow-reward)] active:scale-95">
            <Sparkles className="h-4 w-4" />
            Создать первый курс
          </Button>
        </div>
      </section>
    </div>
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
    <Card className={cn("rounded-xl bg-card shadow-[var(--shadow-card)]", highlight && "border-reward/40 bg-gradient-to-br from-reward/10 to-transparent")}>
      <CardContent className="flex gap-4 p-5">
        <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", highlight ? "bg-reward/10 text-reward" : "bg-primary/10 text-primary")}>
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
