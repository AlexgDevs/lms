import type { ReactNode } from "react"
import { Card, CardContent } from "@/components/ui/card"

export function LegalPage({
  title,
  updated,
  children,
}: {
  title: string
  updated?: string
  children: ReactNode
}) {
  return (
    <div className="max-w-3xl mx-auto space-y-6 py-8 px-4 sm:px-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
        {updated && <p className="mt-1 text-xs text-muted-foreground">Обновлено: {updated}</p>}
      </div>
      <Card className="rounded-2xl shadow-[var(--shadow-card)]">
        <CardContent className="prose prose-sm max-w-none text-muted-foreground">
          {children}
        </CardContent>
      </Card>
    </div>
  )
}
