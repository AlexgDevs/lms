import { useEffect, useState } from "react"
import { useNavigate } from "@tanstack/react-router"
import { useQueryClient } from "@tanstack/react-query"
import { AlertTriangle, CheckCircle2, Loader2, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  useAiGenerationQuota,
  useGenerateCourse,
} from "@/features/teaching/api/useCourseGenerate"
import { ModuleService } from "@/client"
import { getCoursesApiV1CoursesGetQueryKey } from "@/client/@tanstack/react-query.gen"
import { showErrorToast, showSuccessToast } from "@/lib/toast"
import { ROUTES } from "@/routes"

const STRUCTURE_DEFAULTS = {
  modules_count: 3,
  lessons_per_module: 5,
  blocks_per_lesson: 6,
}

const POLL_INTERVAL_MS = 3000
const GENERATION_TIMEOUT_MS = 4 * 60 * 1000

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
}

export function CourseGenerateCard() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: quota } = useAiGenerationQuota()
  const generate = useGenerateCourse()

  const [topic, setTopic] = useState("")
  const [phase, setPhase] = useState<"idle" | "generating">("idle")
  const [generationCourseId, setGenerationCourseId] = useState<string>()
  const [elapsed, setElapsed] = useState(0)

  const isGenerating = phase === "generating"
  const remaining = quota?.remaining ?? 0
  const limit = quota?.limit ?? 0

  // Таймер прошедшего времени
  useEffect(() => {
    if (!isGenerating) return
    const interval = window.setInterval(() => setElapsed((s) => s + 1), 1000)
    return () => window.clearInterval(interval)
  }, [isGenerating])

  // Поллинг завершения генерации
  useEffect(() => {
    if (!isGenerating || !generationCourseId) return

    let cancelled = false

    const poll = async () => {
      try {
        const modules = await ModuleService.getModulesApiV1CoursesCourseIdModulesGet({
          path: { course_id: generationCourseId },
          query: { only_created: true },
        })
        if (cancelled) return
        if (Array.isArray(modules) && modules.length > 0) {
          window.clearInterval(timer)
          window.clearTimeout(timeout)
          queryClient.invalidateQueries({
            queryKey: getCoursesApiV1CoursesGetQueryKey(),
          })
          showSuccessToast("Курс сгенерирован!")
          navigate({
            to: `${ROUTES.TEACHING_COURSE}/$courseId`,
            params: { courseId: generationCourseId },
          })
        }
      } catch {
        if (cancelled) return
        window.clearInterval(timer)
        window.clearTimeout(timeout)
        showErrorToast("Не удалось сгенерировать курс. Попробуйте ещё раз.")
        setGenerationCourseId(undefined)
        setPhase("idle")
      }
    }

    const timer = window.setInterval(poll, POLL_INTERVAL_MS)
    const timeout = window.setTimeout(() => {
      window.clearInterval(timer)
      showErrorToast("Генерация заняла слишком много времени. Попробуйте ещё раз.")
      setGenerationCourseId(undefined)
      setPhase("idle")
    }, GENERATION_TIMEOUT_MS)

    return () => {
      cancelled = true
      window.clearInterval(timer)
      window.clearTimeout(timeout)
    }
  }, [isGenerating, generationCourseId, navigate, queryClient])

  const handleGenerate = async () => {
    if (!topic.trim()) return
    try {
      const res = await generate.mutateAsync({
        body: { topic: topic.trim(), ...STRUCTURE_DEFAULTS },
      })
      setGenerationCourseId(res.course_id)
      setElapsed(0)
      setPhase("generating")
    } catch {
      // Тост об ошибке уже показан в хуке
    }
  }

  const canGenerate = remaining > 0 && !isGenerating

  return (
    <div className="p-5 rounded-xl bg-card space-y-4 shadow-[var(--shadow-card)]">
      <div className="space-y-1">
        <h4 className="font-semibold text-sm text-foreground flex items-center gap-2">
          Сгенерировать программу
        </h4>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Введите тему курса, и ИИ создаст структуру разделов, уроков и тестов за несколько секунд.
        </p>
      </div>

      <div className="flex items-center gap-2">
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
            remaining > 0
              ? "bg-success/10 text-success"
              : "bg-destructive/10 text-destructive"
          }`}
        >
          {remaining > 0 ? (
            <CheckCircle2 className="w-3.5 h-3.5" />
          ) : (
            <AlertTriangle className="w-3.5 h-3.5" />
          )}
          {remaining > 0
            ? `Осталось: ${remaining} из ${limit}`
            : "Лимит генераций исчерпан"}
        </span>
      </div>

      {isGenerating ? (
        <div className="flex items-center justify-center gap-3 py-4">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <div className="text-center">
            <p className="text-sm font-semibold text-foreground">
              ИИ генерирует структуру курса
            </p>
            <p className="text-[11px] text-muted-foreground font-mono">
              {formatElapsed(elapsed)} • обычно до 2 минут
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && canGenerate && topic.trim()) handleGenerate()
            }}
            placeholder="Например: Продвинутый Kubernetes..."
            className="w-full bg-muted/40 rounded-md px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-colors"
          />
          <Button
            className="w-full"
            disabled={!canGenerate || !topic.trim()}
            onClick={handleGenerate}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Создать структуру</span>
          </Button>
        </div>
      )}
    </div>
  )
}
