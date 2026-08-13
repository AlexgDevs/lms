import { Bell } from "lucide-react"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"

const NOTIFICATION_ITEMS = [
    "Новые уроки в ваших курсах",
    "Ответы преподавателя на вопросы",
    "Акции и скидки на курсы",
] as const

export function NotificationsPanel() {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Bell className="w-4 h-4" />
                    Уведомления
                </CardTitle>
                <CardDescription>
                    Выберите, какие события присылать вам на почту.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
                {NOTIFICATION_ITEMS.map((label) => (
                    <div
                        key={label}
                        className="flex items-center justify-between rounded-xl bg-muted/40 px-4 py-3"
                    >
                        <span className="text-sm font-medium text-muted-foreground">{label}</span>
                        <span className="text-xs font-semibold text-muted-foreground/60 bg-muted/60 px-2 py-1 rounded-full">
                            Скоро
                        </span>
                    </div>
                ))}
            </CardContent>
        </Card>
    )
}
