import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import type { CodeBlockPayload } from "@/features/teaching/schemas/block"

interface CodeBlockEditorProps {
  payload: CodeBlockPayload
  onChange: (payload: CodeBlockPayload) => void
}

export function CodeBlockEditor({ payload, onChange }: CodeBlockEditorProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-[11px] text-muted-foreground font-medium">Код:</label>
        <Input
          value={payload.language ?? "python"}
          onChange={(e) => onChange({ ...payload, language: e.target.value })}
          placeholder="Язык (python, js...)"
          className="h-6 text-[11px] w-32"
        />
      </div>
      <Textarea
        value={payload.code ?? ""}
        onChange={(e) => onChange({ ...payload, code: e.target.value })}
        placeholder="Напишите исходный код..."
        className="text-xs font-mono min-h-[100px] bg-muted/30"
      />
    </div>
  )
}
