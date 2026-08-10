import { Textarea } from "@/components/ui/textarea"
import type { TextBlockPayload } from "@/features/teaching/schemas/block"

interface TextBlockEditorProps {
  payload: TextBlockPayload
  onChange: (payload: TextBlockPayload) => void
}

export function TextBlockEditor({ payload, onChange }: TextBlockEditorProps) {
  return (
    <div className="space-y-1">
      <label className="text-[11px] text-muted-foreground font-medium">Текст контента:</label>
      <Textarea
        value={payload.text ?? ""}
        onChange={(e) => onChange({ text: e.target.value })}
        placeholder="Введите текст материала..."
        className="text-xs min-h-[100px]"
      />
    </div>
  )
}
