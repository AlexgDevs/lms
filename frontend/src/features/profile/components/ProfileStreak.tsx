import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Flame } from "lucide-react";
import { DuotoneIcon } from "@/components/ui/duotone-icon";

interface ProfileStreakProps {
  streakDays?: number;
}

export function ProfileStreak({ streakDays = 0 }: ProfileStreakProps) {
  return (
    <Card className="bg-card flex flex-col justify-between">
      <CardHeader className="pb-2">
        <CardDescription>Ударный режим</CardDescription>
        <CardTitle className="text-3xl font-extrabold flex items-center gap-2 text-reward">
          <DuotoneIcon icon={Flame} tone="reward" size={28} className="animate-pulse" />
          <span>{streakDays} {getDaysDeclension(streakDays)}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground">
          {streakDays > 0
            ? "Заходите каждый день, чтобы не потерять серию!"
            : "Занимайтесь каждый день, чтобы запустить серию!"}
        </p>
      </CardContent>
    </Card>
  );
}

// Хелпер для склонения слова "день"
function getDaysDeclension(number: number): string {
  const abs = Math.abs(number) % 100;
  const n = abs % 10;
  if (abs > 10 && abs < 20) return "дней";
  if (n > 1 && n < 5) return "дня";
  if (n === 1) return "день";
  return "дней";
}
