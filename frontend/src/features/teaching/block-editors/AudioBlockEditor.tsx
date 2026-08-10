import { Input } from "@/components/ui/input"
import type { AudioBlockPayload } from "@/features/teaching/schemas/block"

interface AudioBlockEditorProps {
  payload: AudioBlockPayload
  onChange: (payload: AudioBlockPayload) => void
}

export function AudioBlockEditor({ payload, onChange }: AudioBlockEditorProps) {
  return (
    <div className="space-y-2">
      <label className="text-[11px] text-muted-foreground font-medium">URL аудио:</label>
      <Input
        value={payload.url ?? ""}
        onChange={(e) => onChange({ ...payload, url: e.target.value })}
        placeholder="https://example.com/audio.mp3"
        className="text-xs"
      />
    </div>
  )
}
