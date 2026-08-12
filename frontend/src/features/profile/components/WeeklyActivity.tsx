import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BookCheck } from "lucide-react";

export interface DayActivity {
  day: string;
  count: number; // Количество пройденных уроков / задач
}

interface WeeklyActivityProps {
  activity?: DayActivity[];
  maxCount?: number; // Максимальное число уроков для расчета 100% высоты
}

const DEFAULT_ACTIVITY: DayActivity[] = [
  { day: "Пн", count: 4 },
  { day: "Вт", count: 7 },
  { day: "Ср", count: 0 },
  { day: "Чт", count: 3 },
  { day: "Пт", count: 9 },
  { day: "Сб", count: 2 },
  { day: "Вс", count: 0 },
];

export function WeeklyActivity({ 
  activity = DEFAULT_ACTIVITY, 
  maxCount = 10 
}: WeeklyActivityProps) {
  return (
    <Card className="border-border bg-card md:col-span-2 flex flex-col justify-between">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <BookCheck size={18} className="text-primary" />
          Активность за неделю
        </CardTitle>
        <CardDescription className="text-xs">
          Высота столбика зависит от количества пройденных материалов
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-6">
        {/* Контейнер с CSS 3D перспективой */}
        <div className="grid grid-cols-7 gap-3 text-center h-40 items-end px-2 [perspective:800px]">
          {activity.map((item, index) => {
            // Вычисляем процент высоты (от 5% для пустых до 100%)
            const percentage = Math.min(Math.max((item.count / maxCount) * 100, 6), 100);
            const isActive = item.count > 0;

            return (
              <div 
                key={index} 
                className="flex flex-col items-center justify-end h-full group cursor-pointer"
              >
                {/* 3D Сцена столбика */}
                <div className="w-full h-full flex items-end justify-center pb-2">
                  <div 
                    className="relative w-full max-w-[28px] transition-all duration-500 ease-out [transform-style:preserve-3d] [transform:rotateX(-18deg)_rotateY(-18deg)] group-hover:[transform:rotateX(-12deg)_rotateY(-10deg)_translateY(-4px)]"
                    style={{ height: `${percentage}%` }}
                  >
                    {/* Передняя грань */}
                    <div 
                      className={`absolute inset-0 rounded-sm border-t border-l border-white/20 transition-colors ${
                        isActive 
                          ? "bg-primary shadow-lg shadow-primary/20" 
                          : "bg-muted-foreground/10"
                      }`} 
                    />

                    {/* Правая (боковая) грань */}
                    <div 
                      className={`absolute top-0 right-0 bottom-0 w-3 origin-right [transform:rotateY(90deg)] rounded-r-sm transition-colors ${
                        isActive ? "bg-primary/70" : "bg-muted-foreground/20"
                      }`} 
                    />

                    {/* Верхняя грань (крышка 3D столбика) */}
                    <div 
                      className={`absolute top-0 left-0 right-0 h-3 origin-top [transform:rotateX(90deg)] rounded-t-sm transition-colors ${
                        isActive ? "bg-primary-foreground/30" : "bg-muted-foreground/30"
                      }`} 
                    />

                    {/* Тултип с количеством при наведении */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground text-[10px] font-bold px-1.5 py-0.5 rounded shadow pointer-events-none whitespace-nowrap border border-border">
                      {item.count} ур.
                    </div>
                  </div>
                </div>

                {/* Подпись дня недели */}
                <span className={`text-xs font-medium transition-colors ${isActive ? "text-foreground font-semibold" : "text-muted-foreground"}`}>
                  {item.day}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}