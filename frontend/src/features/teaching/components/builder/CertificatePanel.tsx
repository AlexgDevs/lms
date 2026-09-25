import { useState } from "react"
import { Award, ChevronDown, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

interface CertificatePanelProps {
  certificateEnabled: boolean
  isUpdatingCourse: boolean
  onToggleCertificate: (enabled: boolean) => Promise<void>
  /** Компактный вариант без карточной обёртки (для Popover «Настройки курса»). */
  plain?: boolean
}

export function CertificatePanel({
  certificateEnabled,
  isUpdatingCourse,
  onToggleCertificate,
  plain = false,
}: CertificatePanelProps) {
  const [open, setOpen] = useState(false)
  const disabled = isUpdatingCourse

  const handleToggle = async () => {
    if (disabled) return
    await onToggleCertificate(!certificateEnabled)
  }

  const header = (
    <>
      <div
        className={cn(
          "flex items-center gap-2 min-w-0",
          plain ? "" : "flex-1 min-w-0",
        )}
      >
        <Award
          className={cn(
            "text-reward shrink-0",
            plain ? "w-3.5 h-3.5" : "w-4 h-4",
          )}
        />
        <div className="min-w-0">
          <h3
            className={cn(
              "text-foreground",
              plain
                ? "font-semibold text-xs"
                : "font-semibold text-sm",
            )}
          >
            Сертификат о прохождении
          </h3>
          {!plain && (
            <p className="text-xs text-muted-foreground">
              Выдаётся после завершения всех уроков курса
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {plain && (
          <span className="text-[11px] text-muted-foreground">
            {certificateEnabled ? "Вкл" : "Выкл"}
          </span>
        )}
        {isUpdatingCourse && (
          <Loader2
            className={cn(
              "animate-spin text-muted-foreground",
              plain ? "w-3.5 h-3.5" : "w-4 h-4",
            )}
          />
        )}
        <ChevronDown
          size={16}
          className={cn(
            "text-muted-foreground transition-transform",
            !open && "-rotate-90",
          )}
        />
      </div>
    </>
  )

  const body = open && (
    <div
      className={cn(
        "flex flex-col gap-3",
        plain ? "pb-1 pl-6" : "px-4 pb-4",
      )}
    >
      <div className="flex items-center gap-2">
        <Checkbox
          id="certificate-enabled"
          checked={certificateEnabled}
          onCheckedChange={handleToggle}
          disabled={disabled}
        />
        <Label htmlFor="certificate-enabled" className="text-xs cursor-pointer">
          Включить выдачу сертификатов
        </Label>
      </div>

      {certificateEnabled && (
        <Button
          size="sm"
          variant="outline"
          className="text-xs gap-1.5 self-start"
          disabled={disabled}
          onClick={() => handleToggle()}
        >
          <Award className="w-3 h-3" />
          Отключить сертификат
        </Button>
      )}
    </div>
  )

  if (plain) {
    return (
      <div className="space-y-2">
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="w-full flex items-center justify-between gap-3 text-left hover:bg-muted/40 rounded-md px-1.5 py-1.5 -mx-1.5 transition-colors"
        >
          {header}
        </button>
        {body}
      </div>
    )
  }

  return (
    <Card className="rounded-xl shadow-[var(--shadow-card)] mb-4 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="w-full p-4 flex items-center justify-between gap-3 text-left"
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-md bg-reward/10 text-reward flex items-center justify-center shrink-0">
            <Award className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-sm text-foreground">
              Сертификат о прохождении
            </h3>
            <p className="text-xs text-muted-foreground">
              Выдаётся после завершения всех уроков курса
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isUpdatingCourse && (
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          )}
          <ChevronDown
            size={16}
            className={cn(
              "text-muted-foreground transition-transform",
              !open && "-rotate-90",
            )}
          />
        </div>
      </button>

      {body}
    </Card>
  )
}
