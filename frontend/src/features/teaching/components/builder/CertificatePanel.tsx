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
}

export function CertificatePanel({
  certificateEnabled,
  isUpdatingCourse,
  onToggleCertificate,
}: CertificatePanelProps) {
  const [open, setOpen] = useState(false)
  const disabled = isUpdatingCourse

  const handleToggle = async () => {
    if (disabled) return
    await onToggleCertificate(!certificateEnabled)
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

      {open && (
        <div className="px-4 pb-4 flex flex-col gap-3">
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
              className="text-xs gap-1.5"
              disabled={disabled}
              onClick={() => handleToggle()}
            >
              <Award className="w-3 h-3" />
              Отключить сертификат
            </Button>
          )}
        </div>
      )}
    </Card>
  )
}
