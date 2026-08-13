import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Trophy, Flame, Rocket, Code2, Sparkles } from "lucide-react";
import { DuotoneIcon } from "@/components/ui/duotone-icon";
import type { LucideIcon } from "lucide-react";

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  tone: "accent" | "reward";
  unlocked: boolean;
  unlockedAt?: string;
  color: string; // Tailwind градиент для подсвечивания открытой ачивки
}

interface ProfileAchievementsProps {
  achievements?: Achievement[];
}

// Моковые ачивки: первая unlocked по дефолту!
const DEFAULT_ACHIEVEMENTS: Achievement[] = [
  {
    id: "pioneer",
    title: "Пионер Plectix",
    description: "Выдаётся за то, что ты существуешь и присоединился к нам!",
    icon: Sparkles,
    tone: "reward",
    unlocked: true,
    unlockedAt: "25.07.2026",
    color: "from-reward/20 to-reward/5",
  },
  {
    id: "on_fire",
    title: "В ударе",
    description: "Держите стрик обучения 7 дней подряд",
    icon: Flame,
    tone: "reward",
    unlocked: false,
    color: "from-reward/20 to-reward/5",
  },
  {
    id: "first_step",
    title: "Первый шаг",
    description: "Успешно сдайте первое домашнее задание",
    icon: Rocket,
    tone: "accent",
    unlocked: false,
    color: "from-primary/20 to-primary/5",
  },
  {
    id: "code_master",
    title: "Код-Ниндзя",
    description: "Решите 50 практических задач без ошибок",
    icon: Code2,
    tone: "accent",
    unlocked: false,
    color: "from-primary/20 to-primary/5",
  },
];

export function ProfileAchievements({ achievements = DEFAULT_ACHIEVEMENTS }: ProfileAchievementsProps) {
  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  return (
    <Card className="bg-card">
      <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Trophy size={18} className="text-primary" />
            Достижения
          </CardTitle>
          <CardDescription className="text-xs pt-0.5">
            Получено {unlockedCount} из {achievements.length}
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent>
        {/* Сетка бейджей */}
        <div className="grid grid-cols-2 gap-2.5">
          {achievements.map((item) => (
            <div
              key={item.id}
              title={item.unlocked ? `Получено: ${item.unlockedAt}` : "Заблокировано"}
              className={`relative flex items-center gap-3 p-2.5 rounded-xl transition-all duration-300 group ${
                item.unlocked
                  ? `bg-gradient-to-br ${item.color} shadow-[var(--shadow-card)] cursor-pointer hover:scale-[1.02]`
                  : "bg-muted/20 text-muted-foreground/40 grayscale opacity-60"
              }`}
            >
              <DuotoneIcon
                icon={item.icon}
                tone={item.tone}
                size={20}
                className={item.unlocked ? "transition-transform group-hover:scale-110" : undefined}
              />

              {/* Текст */}
              <div className="min-w-0 flex-1">
                <p className={`text-xs font-bold truncate ${item.unlocked ? "text-foreground" : "text-muted-foreground"}`}>
                  {item.title}
                </p>
                <p className="text-[10px] text-muted-foreground line-clamp-1 leading-tight mt-0.5">
                  {item.description}
                </p>
              </div>

              {/* Эффект свечения для разблокированной ачивки */}
              {item.unlocked && (
                <div className="absolute top-1 right-1.5 w-1.5 h-1.5 rounded-full bg-reward animate-ping" />
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
