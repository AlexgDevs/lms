import { Input } from "@/components/ui/input"
import type { FileBlockPayload } from "@/features/teaching/schemas/block"

interface FileBlockEditorProps {
  payload: FileBlockPayload
  onChange: (payload: FileBlockPayload) => void
}

export function FileBlockEditor({ payload, onChange }: FileBlockEditorProps) {
  return (
    <div className="space-y-2">
      <label className="text-[11px] text-muted-foreground font-medium">URL файла:</label>
      <Input
        value={payload.url ?? ""}
        onChange={(e) => onChange({ ...payload, url: e.target.value })}
        placeholder="https://example.com/file.pdf"
        className="text-xs"
      />

      <Input
        value={payload.file_name ?? ""}
        onChange={(e) => onChange({ ...payload, file_name: e.target.value })}
        placeholder="Имя файла"
        className="text-xs"
      />

      <Input
        type="number"
        value={payload.file_size ?? 0}
        onChange={(e) => onChange({ ...payload, file_size: Number(e.target.value) || 0 })}
        placeholder="Размер (байт)"
        className="text-xs"
      />
    </div>
  )
}
