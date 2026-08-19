import { Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import type {
  CodeBlockPayload,
  CodeTestCase,
} from "@/features/teaching/schemas/block"
import { CODE_LANGUAGES } from "@/features/teaching/schemas/block"

interface CodeBlockEditorProps {
  payload: CodeBlockPayload
  onChange: (payload: CodeBlockPayload) => void
}

export function CodeBlockEditor({ payload, onChange }: CodeBlockEditorProps) {
  const testCases = payload.test_cases ?? []

  const handleAddTest = () => {
    onChange({ ...payload, test_cases: [...testCases, { input: "", output: "" }] })
  }

  const handleChangeTest = (index: number, field: keyof CodeTestCase, value: string) => {
    const next = testCases.map((test, i) =>
      i === index ? { ...test, [field]: value } : test,
    )
    onChange({ ...payload, test_cases: next })
  }

  const handleRemoveTest = (index: number) => {
    onChange({ ...payload, test_cases: testCases.filter((_, i) => i !== index) })
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-[11px] text-muted-foreground font-medium">Язык:</label>
        <Select value={payload.language} onValueChange={(value) => onChange({ ...payload, language: value })}>
          <SelectTrigger className="h-6 w-36 text-[11px] rounded-lg">
            <SelectValue placeholder="Выберите язык" />
          </SelectTrigger>
          <SelectContent>
            {CODE_LANGUAGES.map((lang) => (
              <SelectItem key={lang.value} value={lang.value}>
                {lang.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Textarea
        value={payload.code ?? ""}
        onChange={(e) => onChange({ ...payload, code: e.target.value })}
        placeholder="Напишите исходный код..."
        className="text-xs font-mono min-h-[100px] bg-muted/30"
      />

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-medium text-muted-foreground">
            Тестовые случаи (вход → ожидаемый вывод):
          </label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-6 text-[10px] gap-1"
            onClick={handleAddTest}
          >
            <Plus size={11} /> Добавить тест
          </Button>
        </div>

        <div className="space-y-2">
          {testCases.map((test, index) => (
            <div key={index} className="rounded-lg border border-border p-2 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-muted-foreground">
                  Тест {index + 1}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground hover:text-destructive shrink-0"
                  onClick={() => handleRemoveTest(index)}
                >
                  <X size={13} />
                </Button>
              </div>
              <Textarea
                value={test.input}
                onChange={(e) => handleChangeTest(index, "input", e.target.value)}
                placeholder="Входные данные (stdin)..."
                className="text-xs font-mono min-h-[44px] bg-muted/30"
              />
              <Textarea
                value={test.output}
                onChange={(e) => handleChangeTest(index, "output", e.target.value)}
                placeholder="Ожидаемый вывод (stdout)..."
                className="text-xs font-mono min-h-[44px] bg-muted/30"
              />
            </div>
          ))}

          {testCases.length === 0 && (
            <div className="text-center py-4 rounded-md bg-muted/30 text-xs text-muted-foreground">
              Нет тестов. Без тестов код-блок засчитывается автоматически.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}