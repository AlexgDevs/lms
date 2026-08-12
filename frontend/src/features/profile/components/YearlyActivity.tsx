import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CalendarDays, Loader2 } from "lucide-react";

export interface ContributionDay {
  date: string; // YYYY-MM-DD
  count: number; // Кол-во активности
}

interface YearlyActivityProps {
  data?: ContributionDay[];
  isLoading?: boolean;
}

export function YearlyActivity({ data = [], isLoading = false }: YearlyActivityProps) {
  const days = data;

  if (isLoading) {
    return (
      <Card className="border-border bg-card">
        <CardContent className="flex items-center justify-center py-10">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  // Вычисляем уровень подсветки (0..4)
  const getLevelClass = (count: number) => {
    if (count === 0) return "bg-muted/40 hover:border-border";
    if (count <= 2) return "bg-primary/30 border-primary/40";
    if (count <= 4) return "bg-primary/60 border-primary/70";
    if (count <= 6) return "bg-primary/85 border-primary";
    return "bg-primary border-primary shadow-sm shadow-primary/40";
  };

  const totalContributions = days.reduce((acc, curr) => acc + curr.count, 0);

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <CalendarDays size={18} className="text-primary" />
            Годовая активность
          </CardTitle>
          <CardDescription className="text-xs pt-1">
            {totalContributions} прохождений за последний год
          </CardDescription>
        </div>

        {/* Легенда интенсивности */}
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <span>Меньше</span>
          <div className="flex gap-1">
            <div className="w-2.5 h-2.5 rounded-[2px] bg-muted/40 border border-border" />
            <div className="w-2.5 h-2.5 rounded-[2px] bg-primary/30" />
            <div className="w-2.5 h-2.5 rounded-[2px] bg-primary/60" />
            <div className="w-2.5 h-2.5 rounded-[2px] bg-primary/85" />
            <div className="w-2.5 h-2.5 rounded-[2px] bg-primary" />
          </div>
          <span>Больше</span>
        </div>
      </CardHeader>

      <CardContent>
        {/* Горизонтальный скролл на случай узких экранов */}
        <div className="overflow-x-auto pb-2 scrollbar-thin">
          <div className="grid grid-rows-7 grid-flow-col gap-1.5 min-w-[680px]">
            {days.map((item) => (
              <div
                key={item.date}
                title={`${item.date}: ${item.count} задач/уроков`}
                className={`w-3 h-3 rounded-[3px] border border-transparent transition-all cursor-pointer hover:scale-125 hover:z-10 ${getLevelClass(
                  item.count
                )}`}
              />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}