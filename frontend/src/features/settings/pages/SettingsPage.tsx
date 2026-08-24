import { useState } from "react"
import { Bell, CreditCard, KeyRound, Shield, User as UserIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { ProfileSettingsForm } from "@/features/settings/components/ProfileSettingsForm"
import { PaymentDetailsPanel } from "@/features/settings/components/PaymentDetailsPanel"
import { NotificationsPanel } from "@/features/settings/components/NotificationsPanel"
import { PasswordChangePanel } from "@/features/settings/components/PasswordChangePanel"
import { SessionsPanel } from "@/features/settings/components/SessionsPanel"

type SettingsTab = "profile" | "payment" | "password" | "notifications" | "sessions"

const TABS = [
    { id: "profile", label: "Профиль", icon: UserIcon },
    { id: "payment", label: "Реквизиты", icon: CreditCard },
    { id: "password", label: "Пароль", icon: KeyRound },
    { id: "notifications", label: "Уведомления", icon: Bell },
    { id: "sessions", label: "Сессии", icon: Shield },
] as const

export function SettingsPage() {
    const [tab, setTab] = useState<SettingsTab>("profile")

    return (
        <div className="max-w-4xl mx-auto space-y-6 py-2">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">Настройки</h1>
                <p className="text-xs text-muted-foreground mt-0.5">
                    Управление аккаунтом и уведомлениями
                </p>
            </div>

            <div className="flex flex-wrap items-center gap-1 p-1 bg-muted/40 rounded-full w-fit">
                {TABS.map(({ id, label, icon: Icon }) => (
                    <button
                        key={id}
                        type="button"
                        onClick={() => setTab(id)}
                        className={cn(
                            "inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-colors cursor-pointer",
                            tab === id
                                ? "bg-card text-primary shadow-[var(--shadow-card)]"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <Icon className="w-4 h-4" />
                        {label}
                    </button>
                ))}
            </div>

            {tab === "profile" && <ProfileSettingsForm />}
            {tab === "payment" && <PaymentDetailsPanel />}
            {tab === "password" && <PasswordChangePanel />}
            {tab === "notifications" && <NotificationsPanel />}
            {tab === "sessions" && <SessionsPanel />}
        </div>
    )
}
