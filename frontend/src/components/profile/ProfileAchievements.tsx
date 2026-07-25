import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Sparkles, Trophy, Flame, Rocket, Code2, GraduationCap } from "lucide-react";

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  unlocked: boolean;
  unlockedAt?: string;
  color: string; // Tailwind цвет для подсвечивания открытой ачивки
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
    icon: <Sparkles size={20} />,
    unlocked: true,
    unlockedAt: "25.07.2026",
    color: "from-amber-500/20 to-orange-500/20 text-amber-400 border-amber-500/40",
  },
  {
    id: "on_fire",
    title: "В ударе",
    description: "Держите стрик обучения 7 дней подряд",
    icon: <Flame size={20} />,
    unlocked: false,
    color: "from-orange-500/20 to-red-500/20 text-orange-400 border-orange-500/40",
  },
  {
    id: "first_step",
    title: "Первый шаг",
    description: "Успешно сдайте первое домашнее задание",
    icon: <Rocket size={20} />,
    unlocked: false,
    color: "from-blue-500/20 to-cyan-500/20 text-blue-400 border-blue-500/40",
  },
  {
    id: "code_master",
    title: "Код-Ниндзя",
    description: "Решите 50 практических задач без ошибок",
    icon: <Code2 size={20} />,
    unlocked: false,
    color: "from-emerald-500/20 to-green-500/20 text-emerald-400 border-emerald-500/40",
  },
];

export function ProfileAchievements({ achievements = DEFAULT_ACHIEVEMENTS }: ProfileAchievementsProps) {
  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  return (
    <Card className="border-border bg-card">
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
              className={`relative flex items-center gap-3 p-2.5 rounded-xl border transition-all duration-300 group ${
                item.unlocked
                  ? `bg-gradient-to-br ${item.color} shadow-sm cursor-pointer hover:scale-[1.02]`
                  : "bg-muted/20 border-border/40 text-muted-foreground/40 grayscale opacity-60"
              }`}
            >
              {/* Иконка достижения */}
              <div
                className={`p-2 rounded-lg shrink-0 transition-transform group-hover:scale-110 ${
                  item.unlocked
                    ? "bg-background/40 backdrop-blur-sm shadow-inner"
                    : "bg-muted/30"
                }`}
              >
                {item.icon}
              </div>

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
                <div className="absolute top-1 right-1.5 w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}