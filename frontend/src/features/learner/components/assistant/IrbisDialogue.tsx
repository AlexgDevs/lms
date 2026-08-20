import { useEffect, useRef, useState, type CSSProperties } from "react"
import type { LucideIcon } from "lucide-react"
import {
  ArrowLeft,
  Check,
  ChevronRight,
  CircleHelp,
  Code2,
  Lightbulb,
  MessageCircleQuestion,
  PartyPopper,
  RefreshCw,
  Send,
  Shuffle,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  Wand2,
  X,
} from "lucide-react"
import type { AssistantMessageSchema, BlockSchema } from "@/client"
import {
  AssistantAction,
  AssistantAngle,
  AssistantFocus,
  BlockType,
} from "@/client"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { IRBIS_SPRITE, type IrbisMood } from "@/lib/irbisSprite"
import { useAssistant } from "@/features/learner/api/useAssistant"

interface IrbisDialogueProps {
  open: boolean
  block: BlockSchema
  courseId: string
  lessonId: string
  attempts: number
  initialStage?: "offer" | "focus"
  currentCode?: string
  solved?: boolean
  onClose: () => void
}

type Act = "offer" | "focus" | "ladder" | "answer" | "ask" | "angle"

interface Choice {
  key: string
  label: string
  icon?: LucideIcon
  primary?: boolean
  onClick: () => void
}

const FOCUS_OPTIONS: { value: AssistantFocus; label: string }[] = [
  { value: AssistantFocus.CONFUSED, label: "Запутался в условии" },
  { value: AssistantFocus.THEORY, label: "Знаю теорию, но не знаю, с чего начать" },
  { value: AssistantFocus.CODE_ERROR, label: "В коде ошибка" },
  { value: AssistantFocus.STEPS, label: "Разбери решение по шагам" },
]

const ANGLE_OPTIONS: { value: AssistantAngle; label: string; icon: LucideIcon }[] = [
  { value: AssistantAngle.SIMPLER, label: "Проще", icon: Sparkles },
  { value: AssistantAngle.MORE_EXAMPLES, label: "Больше примеров", icon: Lightbulb },
  { value: AssistantAngle.DIFFERENT_EXAMPLE, label: "Другой пример", icon: Wand2 },
  { value: AssistantAngle.ANOTHER_APPROACH, label: "Другой подход", icon: Shuffle },
]

interface ChoiceContext {
  act: Act
  busy: boolean
  focusOptions: { value: AssistantFocus; label: string }[]
  levels: string[]
  revealedCount: number
  isCode: boolean
  currentCode?: string
  onHelp: () => void
  onFocus: (focus: AssistantFocus) => void
  onNext: () => void
  onAction: (action: AssistantAction) => void
  onOpenAngle: (level: number) => void
  onRegenerate: (angle: AssistantAngle) => void
  onBackToLadder: () => void
  onAsk: () => void
  onThumbs: (good: boolean) => void
  onClose: () => void
}

function buildChoices(ctx: ChoiceContext): Choice[] | null {
  const {
    act,
    busy,
    focusOptions,
    levels,
    revealedCount,
    isCode,
    currentCode,
    onHelp,
    onFocus,
    onNext,
    onAction,
    onOpenAngle,
    onRegenerate,
    onBackToLadder,
    onAsk,
    onThumbs,
    onClose,
  } = ctx

  if (busy || act === "ask") return null
  if (act === "offer") {
    return [
      { key: "help", label: "Помоги", icon: Sparkles, primary: true, onClick: onHelp },
      { key: "alone", label: "Сам справлюсь", onClick: onClose },
    ]
  }
  if (act === "focus") {
    return [
      ...focusOptions.map((option) => ({
        key: option.value,
        label: option.label,
        onClick: () => onFocus(option.value),
      })),
      { key: "ask", label: "Задать свой вопрос", icon: MessageCircleQuestion, onClick: onAsk },
    ]
  }
  if (act === "ladder") {
    const done = revealedCount >= levels.length
    if (done) {
      return [
        { key: "good", label: "Помогло!", icon: ThumbsUp, primary: true, onClick: () => onThumbs(true) },
        { key: "bad", label: "Не помогло", icon: ThumbsDown, onClick: () => onThumbs(false) },
        { key: "again", label: "Объясни иначе…", icon: RefreshCw, onClick: () => onOpenAngle(revealedCount - 1) },
        { key: "ask", label: "Задать свой вопрос", icon: MessageCircleQuestion, onClick: onAsk },
      ]
    }
    return [
      { key: "next", label: "Дальше", icon: ChevronRight, primary: true, onClick: onNext },
      { key: "example", label: "Пример попроще", icon: Lightbulb, onClick: () => onAction(AssistantAction.SIMPLER_EXAMPLE) },
      { key: "why", label: "Почему мой ответ неверный?", icon: CircleHelp, onClick: () => onAction(AssistantAction.WHY_WRONG) },
      ...(isCode && currentCode
        ? [{ key: "diagnose", label: "Найди ошибку в моём коде", icon: Code2, onClick: () => onAction(AssistantAction.DIAGNOSE_CODE) }]
        : []),
      { key: "again", label: "Объясни иначе…", icon: RefreshCw, onClick: () => onOpenAngle(revealedCount - 1) },
      { key: "ask", label: "Задать свой вопрос", icon: MessageCircleQuestion, onClick: onAsk },
    ]
  }
  if (act === "answer") {
    return [
      { key: "ask", label: "Ещё вопрос", icon: MessageCircleQuestion, primary: true, onClick: onAsk },
      { key: "again", label: "Объясни иначе", icon: RefreshCw, onClick: () => onAction(AssistantAction.EXPLAIN_AGAIN) },
      ...(levels.length && revealedCount < levels.length
        ? [{ key: "ladder", label: "К подсказкам", icon: ArrowLeft, onClick: onBackToLadder }]
        : []),
      { key: "done", label: "Готово", icon: Check, onClick: onClose },
    ]
  }
  if (act === "angle") {
    return [
      ...ANGLE_OPTIONS.map((option) => ({
        key: option.value,
        label: option.label,
        icon: option.icon,
        onClick: () => onRegenerate(option.value),
      })),
      { key: "back", label: "← Назад", onClick: onBackToLadder },
    ]
  }
  return null
}

export function IrbisDialogue({
  open,
  block,
  courseId,
  lessonId,
  attempts,
  initialStage = "offer",
  currentCode,
  solved,
  onClose,
}: IrbisDialogueProps) {
  const { requestHint, regenerateLevel, streamAsk, isGenerating } = useAssistant()
  const isCode = block.block_type === BlockType.CODE
  const focusOptions = FOCUS_OPTIONS.filter(
    (option) => isCode || option.value !== AssistantFocus.CODE_ERROR,
  )

  const [act, setAct] = useState<Act>(initialStage)
  const [bubbleText, setBubbleText] = useState<string>(() =>
    initialStage === "offer"
      ? `Вижу, у тебя не получилось с ${attempts}-й попытки. Я — Ирбис, твой помощник. Давай разберёмся вместе — от простого к сложному.`
      : "Отлично! С чего начнём?",
  )
  const [levels, setLevels] = useState<string[]>([])
  const [revealedCount, setRevealedCount] = useState(0)
  const [angleLevel, setAngleLevel] = useState(0)
  const [inputText, setInputText] = useState("")
  const [streamingText, setStreamingText] = useState<string | null>(null)
  const [moodState, setMoodState] = useState<IrbisMood>("idle")
  const [celebrate, setCelebrate] = useState(false)
  const [history, setHistory] = useState<AssistantMessageSchema[]>([])
  const celebratedRef = useRef(false)

  const busy = isGenerating || streamingText !== null
  const mood: IrbisMood = busy ? "thinking" : moodState

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, onClose])

  useEffect(() => {
    if (open && solved && !celebratedRef.current) {
      celebratedRef.current = true
      setMoodState("happy")
      setCelebrate(true)
      setBubbleText("Ура, ты решил задачу! 🎉 Так держать!")
      setAct("answer")
    }
  }, [open, solved])

  if (!open) return null

  const stream = async (
    question: string,
    action: AssistantAction | undefined,
  ): Promise<string | null> => {
    setAct("answer")
    setStreamingText("")
    setMoodState("thinking")
    let acc = ""
    try {
      await streamAsk({
        courseId,
        lessonId,
        blockId: block.id,
        question,
        history,
        revealedLevels: revealedCount,
        action,
        currentCode,
        onDelta: (delta) => {
          acc += delta
          setStreamingText(acc)
        },
      })
      return acc.trim() || null
    } catch {
      return null
    } finally {
      setStreamingText(null)
      setMoodState("idle")
    }
  }

  const runAction = async (action: AssistantAction) => {
    const acc = await stream("", action)
    if (!acc) {
      if (levels.length) {
        setAct("ladder")
        setBubbleText(levels[revealedCount - 1] ?? "…")
      } else {
        setAct("answer")
        setBubbleText("Не получилось ответить, попробуй ещё раз.")
      }
      return
    }
    setBubbleText(acc)
    setHistory((prev) => [...prev, { role: "assistant", content: acc }])
  }

  const handleFocus = async (focus: AssistantFocus) => {
    setAct("ladder")
    setMoodState("thinking")
    try {
      const result = await requestHint({ courseId, lessonId, blockId: block.id, focus })
      setLevels(result.levels)
      setRevealedCount(1)
      setBubbleText(result.levels[0])
      setMoodState("idle")
    } catch {
      setAct("focus")
      setMoodState("sad")
    }
  }

  const handleNext = () => {
    const next = revealedCount + 1
    setRevealedCount(next)
    setBubbleText(levels[next - 1])
  }

  const handleRegenerate = async (angle: AssistantAngle) => {
    setAct("ladder")
    setMoodState("thinking")
    try {
      const result = await regenerateLevel({
        courseId,
        lessonId,
        blockId: block.id,
        levelIndex: angleLevel,
        angle,
      })
      setLevels((prev) => {
        const next = [...prev]
        next[angleLevel] = result.level
        return next
      })
      setBubbleText(result.level)
      setMoodState("idle")
    } catch {
      setAct("ladder")
      setBubbleText(levels[revealedCount - 1] ?? "…")
      setMoodState("idle")
    }
  }

  const handleSendQuestion = async () => {
    const text = inputText.trim()
    if (!text || busy) return
    setInputText("")
    setHistory((prev) => [...prev, { role: "user", content: text }])
    const acc = await stream(text, undefined)
    if (!acc) {
      setAct("ask")
      setInputText(text)
      return
    }
    setBubbleText(acc)
    setHistory((prev) => [...prev, { role: "assistant", content: acc }])
  }

  const startAsk = () => {
    setAct("ask")
    setInputText("")
  }

  const handleThumbs = (good: boolean) => {
    setAct("answer")
    setMoodState(good ? "happy" : "sad")
    if (good) {
      setCelebrate(true)
      setBubbleText("Я рад, что смог помочь! 🎉")
    }
    window.setTimeout(onClose, good ? 1100 : 450)
  }

  const optionList = buildChoices({
    act,
    busy,
    focusOptions,
    levels,
    revealedCount,
    isCode,
    currentCode,
    onHelp: () => {
      setAct("focus")
      setBubbleText("Отлично! С чего начнём?")
    },
    onFocus: (focus) => void handleFocus(focus),
    onNext: handleNext,
    onAction: (action) => void runAction(action),
    onOpenAngle: (level) => {
      setAngleLevel(level)
      setAct("angle")
    },
    onRegenerate: (angle) => void handleRegenerate(angle),
    onBackToLadder: () => {
      setAct("ladder")
      setBubbleText(levels[revealedCount - 1] ?? "…")
    },
    onAsk: startAsk,
    onThumbs: handleThumbs,
    onClose,
  })

  return (
    <div className="fixed bottom-4 right-4 z-40 w-[min(24rem,calc(100vw-2rem))]">
      <div className="flex flex-col items-center gap-2.5">
        <div
          role="dialog"
          aria-label="ИИ-ассистент Ирбис"
          className="w-full rounded-3xl border border-border bg-background/95 p-4 shadow-2xl backdrop-blur animate-bubble-pop"
        >
          <div className="mb-2 flex items-center justify-between">
            <p className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
              <Sparkles className="h-3 w-3" /> Ирбис · ИИ-помощник
            </p>
            <button
              type="button"
              aria-label="Закрыть помощника"
              onClick={onClose}
              className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {streamingText !== null ? (
            <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-foreground">
              {streamingText}
              <span className="ml-0.5 inline-block h-3.5 w-0.5 translate-y-0.5 animate-pulse bg-muted-foreground/70" />
            </p>
          ) : busy ? (
            <ThinkingDots />
          ) : act === "ask" ? (
            <form
              onSubmit={(event) => {
                event.preventDefault()
                void handleSendQuestion()
              }}
              className="flex items-center gap-2"
            >
              <input
                value={inputText}
                onChange={(event) => setInputText(event.target.value)}
                placeholder="Задать свой вопрос…"
                autoFocus
                className="min-w-0 flex-1 rounded-lg border border-border bg-secondary/40 px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary"
              />
              <Button
                type="submit"
                size="icon"
                disabled={!inputText.trim()}
                aria-label="Отправить вопрос"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          ) : (
            <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-foreground">
              {bubbleText}
            </p>
          )}
        </div>

        {optionList && (
          <div className="w-full space-y-1.5">
            {optionList.map((choice) => {
              const Icon = choice.icon
              return (
                <button
                  key={choice.key}
                  type="button"
                  onClick={choice.onClick}
                  className={cn(
                    "flex w-full items-center justify-between gap-2 rounded-xl border px-3.5 py-2.5 text-left text-sm transition-all",
                    choice.primary
                      ? "border-primary/40 bg-primary/10 font-medium text-foreground hover:bg-primary/15"
                      : "border-border bg-background/90 text-foreground hover:border-primary/40 hover:bg-primary/5",
                  )}
                >
                  <span>{choice.label}</span>
                  {Icon && <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />}
                </button>
              )
            })}
          </div>
        )}

        <IrbisSprite mood={mood} celebrate={celebrate} />
      </div>
    </div>
  )
}

function IrbisSprite({ mood, celebrate }: { mood: IrbisMood; celebrate: boolean }) {
  return (
    <div className="relative flex h-28 items-end justify-center animate-irbis-walk-in">
      {celebrate && (
        <>
          <span className="absolute -top-2 left-1/2 -translate-x-1/2 whitespace-nowrap text-sm font-semibold text-foreground animate-bubble-pop">
            <PartyPopper className="mr-1 inline h-4 w-4 text-primary" />
            Ура!
          </span>
          <ConfettiBurst />
        </>
      )}
      <img
        src={IRBIS_SPRITE}
        alt="Ирбис"
        draggable={false}
        className={cn(
          "h-24 w-auto max-w-[7.5rem] object-contain drop-shadow-md",
          mood === "idle" && "animate-irbis-bob",
          mood === "thinking" && "animate-irbis-think",
          mood === "happy" && "animate-irbis-bounce",
          mood === "sad" && "scale-95 opacity-80 saturate-50",
        )}
      />
    </div>
  )
}

const CONFETTI_COLORS = ["#0E7490", "#F59E0B", "#EF4444", "#10B981", "#6366F1", "#EC4899"]

function ConfettiBurst() {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-center">
      {Array.from({ length: 14 }).map((_, index) => {
        const left = ((index * 137.5) % 100) - 20
        const delay = (index % 5) * 0.08
        const rotate = `${(index % 3) * 180 + 180}deg`
        const color = CONFETTI_COLORS[index % CONFETTI_COLORS.length]
        return (
          <span
            key={index}
            className="animate-confetti absolute h-2 w-1.5 rounded-sm"
            style={
              {
                left: `${left}%`,
                background: color,
                animationDelay: `${delay}s`,
                "--confetti-rotate": rotate,
              } as CSSProperties
            }
          />
        )
      })}
    </div>
  )
}

function ThinkingDots() {
  return (
    <div className="flex items-center gap-1 py-1">
      {[0, 1, 2].map((index) => (
        <span
          key={index}
          className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/60"
          style={{ animationDelay: `${index * 120}ms` }}
        />
      ))}
    </div>
  )
}