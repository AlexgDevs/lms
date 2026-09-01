import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface BlockPerf {
  block_id: string
  title: string
  block_type: string
  lesson_title: string
  accuracy: number
  avg_attempts: number
  first_try_rate: number
  total_submissions: number
}

interface BlocksTableProps {
  blocks: BlockPerf[]
}

const typeLabels: Record<string, string> = {
  QUIZ_SINGLE_CHOICE: "Quiz",
  QUIZ_MULTIPLE_CHOICE: "Multi",
  CODE: "Code",
  TEXT: "Text",
}

export function BlocksTable({ blocks }: BlocksTableProps) {
  return (
    <Card className="rounded-xl">
      <CardHeader>
        <CardTitle className="text-sm font-bold">Точность по блокам</CardTitle>
      </CardHeader>
      <CardContent>
        {blocks.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Блоки пока не добавлены
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-3 text-muted-foreground font-medium">
                    Блок
                  </th>
                  <th className="text-left py-2 px-3 text-muted-foreground font-medium">
                    Тип
                  </th>
                  <th className="text-left py-2 px-3 text-muted-foreground font-medium hidden sm:table-cell">
                    Урок
                  </th>
                  <th className="text-right py-2 px-3 text-muted-foreground font-medium">
                    Точность
                  </th>
                  <th className="text-right py-2 px-3 text-muted-foreground font-medium">
                    1-я попытка
                  </th>
                  <th className="text-right py-2 px-3 text-muted-foreground font-medium">
                    Попытки
                  </th>
                </tr>
              </thead>
              <tbody>
                {blocks.map((block) => (
                  <tr
                    key={block.block_id}
                    className="border-b border-border/40 last:border-0"
                  >
                    <td className="py-2.5 px-3 text-foreground font-medium truncate max-w-[180px]">
                      {block.title}
                    </td>
                    <td className="py-2.5 px-3">
                      <Badge variant="secondary" className="text-[10px]">
                        {typeLabels[block.block_type] ?? block.block_type}
                      </Badge>
                    </td>
                    <td className="py-2.5 px-3 text-muted-foreground truncate max-w-[150px] hidden sm:table-cell">
                      {block.lesson_title}
                    </td>
                    <td className="py-2.5 px-3 text-right tabular-nums">
                      <span
                        className={
                          block.accuracy >= 80
                            ? "text-success"
                            : block.accuracy >= 50
                              ? "text-yellow-500"
                              : "text-destructive"
                        }
                      >
                        {block.accuracy}%
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right text-muted-foreground tabular-nums">
                      {block.first_try_rate}%
                    </td>
                    <td className="py-2.5 px-3 text-right text-muted-foreground tabular-nums">
                      {block.avg_attempts}
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
