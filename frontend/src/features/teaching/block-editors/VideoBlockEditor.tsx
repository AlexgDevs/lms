import { Input } from "@/components/ui/input"
import type { VideoBlockPayload } from "@/features/teaching/schemas/block"

interface VideoBlockEditorProps {
  payload: VideoBlockPayload
  onChange: (payload: VideoBlockPayload) => void
}

export function VideoBlockEditor({ payload, onChange }: VideoBlockEditorProps) {
  return (
    <div className="space-y-2">
      <label className="text-[11px] text-muted-foreground font-medium">URL видео:</label>
      <Input
        value={payload.url ?? ""}
        onChange={(e) => onChange({ ...payload, url: e.target.value })}
        placeholder="https://example.com/video.mp4"
        className="text-xs"
      />

      <Input
        type="number"
        value={payload.duration ?? ""}
        onChange={(e) =>
          onChange({ ...payload, duration: e.target.value ? Number(e.target.value) : null })
        }
        placeholder="Длительность (сек, опционально)"
        className="text-xs"
      />
    </div>
  )
}
