import { Users, UserCheck, UserX, Target } from "lucide-react"
import { Card } from "@/components/ui/card"

interface OverviewCardsProps {
  totalEnrolled: number
  active: number
  churned: number
  completionRate: number
  avgAccuracy?: number
}

export function OverviewCards({
  totalEnrolled,
  active,
  churned,
  completionRate,
}: OverviewCardsProps) {
  const cards = [
    {
      label: "Всего записано",
      value: totalEnrolled,
      icon: Users,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: "Активных",
      value: active,
      icon: UserCheck,
      color: "text-success",
      bg: "bg-success/10",
    },
    {
      label: "Завершили",
      value: `${completionRate}%`,
      icon: Target,
      color: "text-reward",
      bg: "bg-reward/10",
    },
    {
      label: "Отписались",
      value: churned,
      icon: UserX,
      color: "text-destructive",
      bg: "bg-destructive/10",
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <Card key={card.label} className="rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg ${card.bg} flex items-center justify-center`}>
              <card.icon className={`w-5 h-5 ${card.color}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{card.value}</p>
              <p className="text-xs text-muted-foreground">{card.label}</p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}
