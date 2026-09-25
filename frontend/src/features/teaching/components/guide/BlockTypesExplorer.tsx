import { useState, type ReactNode } from "react"
import {
  CircleDot,
  Code,
  File as FileIcon,
  FileText,
  Image as ImageIcon,
  ListChecks,
  Play,
  Video,
  Volume2,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { BlockType } from "@/client"
import { cn } from "@/lib/utils"

interface BlockKind {
  type: BlockType
  icon: LucideIcon
  title: string
  where: string
  description: string
  mock: ReactNode
}

const textLines = (
  <div className="space-y-2">
    <div className="h-2.5 w-2/3 rounded-full bg-foreground/20" />
    <div className="h-2 w-full rounded-full bg-muted-foreground/25" />
    <div className="h-2 w-5/6 rounded-full bg-muted-foreground/25" />
    <div className="h-2 w-3/4 rounded-full bg-muted-foreground/25" />
  </div>
)

const quizOptions = (multiple: boolean) => (
  <div className="space-y-2">
    {["Вариант A", "Вариант B", "Вариант C"].map((option, i) => (
      <div key={option} className="flex items-center gap-2 rounded-md bg-background/70 px-2.5 py-1.5">
        <span
          className={cn(
            "flex h-3.5 w-3.5 shrink-0 items-center justify-center border",
            i === 1 ? "border-primary bg-primary/15" : "border-muted-foreground/40",
            multiple ? "rounded-[3px]" : "rounded-full",
          )}
        >
          {i === 1 && <span className={cn("bg-primary", multiple ? "h-1.5 w-1.5 rounded-[1px]" : "h-1.5 w-1.5 rounded-full")} />}
        </span>
        <span className="text-[11px] text-muted-foreground">{option}</span>
      </div>
    ))}
  </div>
)

const BLOCK_KINDS: BlockKind[] = [
  {
    type: BlockType.TEXT,
    icon: FileText,
    title: "Текст",
    where: "Лекции и конспекты",
    description:
      "Rich-текстовый редактор для наглядных лекций: заголовки, списки, выделение и вставки — как в документе.",
    mock: textLines,
  },
  {
    type: BlockType.QUIZ_SINGLE_CHOICE,
    icon: CircleDot,
    title: "Квиз: один вариант",
    where: "Быстрая проверка",
    description:
      "Классический вопрос с одним правильным ответом. Отлично закрепляет материал в конце урока.",
    mock: quizOptions(false),
  },
  {
    type: BlockType.QUIZ_MULTIPLE_CHOICE,
    icon: ListChecks,
    title: "Квиз: несколько вариантов",
    where: "Сложные вопросы",
    description:
      "Несколько верных ответов сразу — для вопросов-«выборов», повторения и разбора нюансов темы.",
    mock: quizOptions(true),
  },
  {
    type: BlockType.CODE,
    icon: Code,
    title: "Код",
    where: "Практика с автопроверкой",
    description:
      "Студент пишет код прямо в уроке, а система сама прогоняет решение по тестам и выставляет оценку.",
    mock: (
      <div className="space-y-1.5 rounded-md bg-background/70 p-3 font-mono text-[11px] leading-relaxed">
        <div>
          <span className="text-primary">def</span>{" "}
          <span className="text-foreground/80">solve</span>
          <span className="text-muted-foreground">(data):</span>
        </div>
        <div className="pl-3 text-muted-foreground">
          <span className="text-primary">return</span>{" "}
          <span className="text-success">sorted</span>(data)
        </div>
        <div className="pt-1 text-[10px] text-success">✓ Тесты пройдены: 4/4</div>
      </div>
    ),
  },
  {
    type: BlockType.IMAGE,
    icon: ImageIcon,
    title: "Изображение",
    where: "Схемы и инфографика",
    description:
      "Диаграммы, схемы и картинки с подписями — визуализируют то, что трудно объяснить словами.",
    mock: (
      <div className="flex h-20 items-center justify-center rounded-md bg-background/70">
        <ImageIcon className="h-7 w-7 text-muted-foreground/50" />
      </div>
    ),
  },
  {
    type: BlockType.VIDEO,
    icon: Video,
    title: "Видео",
    where: "Видеоуроки и демо",
    description:
      "Вставьте ролик с YouTube, VK Видео или RuTube обычной ссылкой — он откроется прямо в уроке.",
    mock: (
      <div className="relative flex h-20 items-center justify-center rounded-md bg-background/70">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-primary">
          <Play className="h-4 w-4" />
        </span>
      </div>
    ),
  },
  {
    type: BlockType.AUDIO,
    icon: Volume2,
    title: "Аудио",
    where: "Подкасты и языки",
    description:
      "Аудиозаписи для слушания: подкасты, диалоги, произношение — языковая практика прямо в уроке.",
    mock: (
      <div className="flex h-20 items-center justify-center gap-1.5 rounded-md bg-background/70">
        {[8, 14, 20, 12, 24, 16, 10, 18, 12, 8, 14, 10].map((h, i) => (
          <span
            key={i}
            className="w-1 rounded-full bg-primary/60"
            style={{ height: `${h}px` }}
          />
        ))}
      </div>
    ),
  },
  {
    type: BlockType.FILE,
    icon: FileIcon,
    title: "Файл",
    where: "Документы и шаблоны",
    description:
      "Материалы на скачивание: рабочие тетради, шаблоны, таблицы и любые документы к уроку.",
    mock: (
      <div className="flex h-20 items-center justify-center rounded-md bg-background/70">
        <span className="flex items-center gap-2 rounded-md border border-border/60 bg-background px-3 py-2 text-[11px] text-muted-foreground">
          <FileIcon className="h-3.5 w-3.5" />
          shablon-rabotei-tetradi.pdf
        </span>
      </div>
    ),
  },
]

/**
 * Интерактивный обзор типов блоков урока: слева чипы-типы,
 * справа анимированная карточка-превью выбранного типа.
 */
export function BlockTypesExplorer() {
  const [activeIndex, setActiveIndex] = useState(0)
  const active = BLOCK_KINDS[activeIndex]

  return (
    <div className="flex w-full max-w-3xl flex-col gap-4 text-left sm:flex-row">
      {/* Список типов */}
      <div className="flex flex-col gap-1.5 sm:w-64 sm:shrink-0">
        {BLOCK_KINDS.map((kind, index) => {
          const Icon = kind.icon
          const isActive = index === activeIndex
          return (
            <button
              key={kind.type}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-pressed={isActive}
              className={cn(
                "flex items-center gap-2.5 rounded-xl border px-3 py-2 text-left transition-all duration-200",
                isActive
                  ? "border-border bg-card shadow-[var(--shadow-card)]"
                  : "border-transparent hover:bg-card/60",
              )}
            >
              <span
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors",
                  isActive ? "bg-primary/15 text-primary" : "bg-muted/60 text-muted-foreground",
                )}
              >
                <Icon className="h-3.5 w-3.5" />
              </span>
              <span className="min-w-0">
                <span
                  className={cn(
                    "block truncate text-xs font-semibold transition-colors",
                    isActive ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {kind.title}
                </span>
                <span className="block truncate text-[10px] text-muted-foreground/80">
                  {kind.where}
                </span>
              </span>
            </button>
          )
        })}
      </div>

      {/* Превью активного типа */}
      <div
        key={active.type}
        className="animate-in fade-in-0 duration-300 flex-1 space-y-4 rounded-2xl bg-card p-5 shadow-[var(--shadow-card)]"
      >
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <active.icon className="h-4.5 w-4.5" />
          </span>
          <div>
            <h4 className="text-sm font-bold text-foreground">{active.title}</h4>
            <p className="text-[11px] text-muted-foreground">{active.where}</p>
          </div>
        </div>
        <p className="text-xs leading-relaxed text-muted-foreground">{active.description}</p>
        <div className="rounded-xl bg-muted/30 p-3">{active.mock}</div>
      </div>
    </div>
  )
}
