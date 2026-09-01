import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface LessonPerf {
  lesson_id: string
  title: string
  completion_rate: number
  total_started: number
  total_completed: number
}

interface LessonsTableProps {
  lessons: LessonPerf[]
}

export function LessonsTable({ lessons }: LessonsTableProps) {
  return (
    <Card className="rounded-xl">
      <CardHeader>
        <CardTitle className="text-sm font-bold">Прогресс по урокам</CardTitle>
      </CardHeader>
      <CardContent>
        {lessons.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Уроки пока не добавлены
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-3 text-muted-foreground font-medium">
                    Урок
                  </th>
                  <th className="text-right py-2 px-3 text-muted-foreground font-medium">
                    Начали
                  </th>
                  <th className="text-right py-2 px-3 text-muted-foreground font-medium">
                    Завершили
                  </th>
                  <th className="text-right py-2 px-3 text-muted-foreground font-medium">
                    Прогресс
                  </th>
                </tr>
              </thead>
              <tbody>
                {lessons.map((lesson) => (
                  <tr
                    key={lesson.lesson_id}
                    className="border-b border-border/40 last:border-0"
                  >
                    <td className="py-2.5 px-3 text-foreground font-medium truncate max-w-[200px]">
                      {lesson.title}
                    </td>
                    <td className="py-2.5 px-3 text-right text-muted-foreground tabular-nums">
                      {lesson.total_started}
                    </td>
                    <td className="py-2.5 px-3 text-right text-muted-foreground tabular-nums">
                      {lesson.total_completed}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all"
                            style={{ width: `${lesson.completion_rate}%` }}
                          />
                        </div>
                        <span className="text-xs tabular-nums text-muted-foreground w-10 text-right">
                          {lesson.completion_rate}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
