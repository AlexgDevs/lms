import { CreditCard } from "lucide-react"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"

export function PaymentDetailsPanel() {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    Реквизиты
                </CardTitle>
                <CardDescription>
                    Платёжные реквизиты и способы оплаты появятся здесь.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="rounded-xl bg-muted/40 p-6 text-center text-sm text-muted-foreground">
                    Раздел в разработке — скоро.
                </div>
            </CardContent>
        </Card>
    )
}
