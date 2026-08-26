import { Award, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

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
  const disabled = isUpdatingCourse

  const handleToggle = async () => {
    if (disabled) return
    await onToggleCertificate(!certificateEnabled)
  }

  return (
    <Card className="rounded-xl p-4 shadow-[var(--shadow-card)] mb-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-reward/10 text-reward flex items-center justify-center">
            <Award className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-foreground">
              Сертификат о прохождении
            </h3>
            <p className="text-xs text-muted-foreground">
              Выдаётся после завершения всех уроков курса
            </p>
          </div>
        </div>

        {isUpdatingCourse && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
      </div>

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
          className="text-xs gap-1.5 mt-3"
          disabled={disabled}
          onClick={() => handleToggle()}
        >
          <Award className="w-3 h-3" />
          Отключить сертификат
        </Button>
      )}
    </Card>
  )
}
