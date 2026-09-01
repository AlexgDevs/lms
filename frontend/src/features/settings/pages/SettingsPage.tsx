import { useState } from "react"
import type { ReactNode } from "react"
import type { LucideIcon } from "lucide-react"
import { Bell, KeyRound, Settings, Shield } from "lucide-react"
import { cn } from "@/lib/utils"
import { ProfileSettingsForm } from "@/features/settings/components/ProfileSettingsForm"
import { NotificationsPanel } from "@/features/settings/components/NotificationsPanel"
import { PasswordChangePanel } from "@/features/settings/components/PasswordChangePanel"
import { SessionsPanel } from "@/features/settings/components/SessionsPanel"

type SettingsTab = "profile" | "password" | "notifications" | "sessions"

const TABS: { id: SettingsTab; label: string; icon: LucideIcon }[] = [
    { id: "profile", label: "Профиль", icon: Settings },
    { id: "password", label: "Пароль", icon: KeyRound },
    { id: "notifications", label: "Уведомления", icon: Bell },
    { id: "sessions", label: "Сессии", icon: Shield },
]

export function SettingsPage() {
    const [tab, setTab] = useState<SettingsTab>("profile")

    return (
        <div className="max-w-6xl mx-auto space-y-6 py-2">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">Настройки</h1>
                <p className="text-xs text-muted-foreground mt-0.5">
                    Управление аккаунтом и уведомлениями
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-8 items-start">
                <aside className="lg:sticky lg:top-24">
                    <nav className="rounded-xl bg-card border border-border/60 shadow-[var(--shadow-card)] p-2 space-y-1">
                        {TABS.map(({ id, label, icon: Icon }) => (
                            <button
                                key={id}
                                type="button"
                                onClick={() => setTab(id)}
                                className={cn(
                                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer",
                                    tab === id
                                        ? "bg-primary/10 text-primary"
                                        : "text-muted-foreground hover:text-foreground hover:bg-muted/40",
                                )}
                            >
                                <Icon className="w-4 h-4" />
                                {label}
                            </button>
                        ))}
                    </nav>
                </aside>

                <div className="min-w-0">
                    {tab === "profile" && (
                        <SectionCard>
                            <ProfileSettingsForm />
                        </SectionCard>
                    )}
                    {tab === "password" && (
                        <SectionCard>
                            <PasswordChangePanel />
                        </SectionCard>
                    )}
                    {tab === "notifications" && (
                        <SectionCard>
                            <NotificationsPanel />
                        </SectionCard>
                    )}
                    {tab === "sessions" && (
                        <SectionCard>
                            <SessionsPanel />
                        </SectionCard>
                    )}
                </div>
            </div>
        </div>
    )
}

function SectionCard({ children }: { children: ReactNode }) {
    return (
        <div className="rounded-xl bg-card border border-border/60 shadow-[var(--shadow-card)] p-5 sm:p-6">
            {children}
        </div>
    )
}
