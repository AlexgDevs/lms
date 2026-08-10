import { Input } from "@/components/ui/input"
import type { ImageBlockPayload } from "@/features/teaching/schemas/block"

interface ImageBlockEditorProps {
  payload: ImageBlockPayload
  onChange: (payload: ImageBlockPayload) => void
}

export function ImageBlockEditor({ payload, onChange }: ImageBlockEditorProps) {
  return (
    <div className="space-y-2">
      <label className="text-[11px] text-muted-foreground font-medium">URL изображения:</label>
      <Input
        value={payload.url ?? ""}
        onChange={(e) => onChange({ ...payload, url: e.target.value })}
        placeholder="https://example.com/image.png"
        className="text-xs"
      />

      {payload.url && (
        <img
          src={payload.url}
          alt={payload.alt_text ?? ""}
          className="max-h-40 rounded-lg border object-contain bg-muted/20"
        />
      )}

      <Input
        value={payload.alt_text ?? ""}
        onChange={(e) => onChange({ ...payload, alt_text: e.target.value })}
        placeholder="Альтернативный текст (alt)"
        className="text-xs"
      />
    </div>
  )
}
