import * as z from "zod"

import { BlockType } from "@/client"

// Business limits (mirror backend core/schemas/limits.py)
export const RICH_TEXT_MAX = 50_000
export const CODE_MAX = 100_000
export const QUIZ_OPTION_MAX = 500
export const QUIZ_OPTIONS_MIN = 2
export const QUIZ_OPTIONS_MAX = 10
export const TEST_CASES_MAX = 20
export const LANGUAGE_MAX = 32
export const ALT_TEXT_MAX = 255
export const URL_MAX = 2_048

// --- SHARED ---

export const quizOptionSchema = z.object({
  id: z.number().int().positive(),
  text: z
    .string()
    .min(1, "Текст варианта не может быть пустым")
    .max(QUIZ_OPTION_MAX, `Вариант не должен превышать ${QUIZ_OPTION_MAX} символов`),
})

export type QuizOption = z.infer<typeof quizOptionSchema>

// --- PAYLOAD SCHEMAS (mirror backend block/schemas.py PAYLOAD_REGISTRY) ---

export const textBlockPayloadSchema = z.object({
  text: z.string().max(RICH_TEXT_MAX, `Текст не должен превышать ${RICH_TEXT_MAX} символов`),
  html: z
    .string()
    .max(RICH_TEXT_MAX, `Текст не должен превышать ${RICH_TEXT_MAX} символов`)
    .optional(),
})

export const codeTestCaseSchema = z.object({
  input: z.string().max(CODE_MAX, `Ввод не должен превышать ${CODE_MAX} символов`),
  output: z.string().max(CODE_MAX, `Вывод не должен превышать ${CODE_MAX} символов`),
})

export const codeBlockPayloadSchema = z.object({
  code: z.string().max(CODE_MAX, `Код не должен превышать ${CODE_MAX} символов`),
  language: z
    .string()
    .min(1, "Укажите язык программирования")
    .max(LANGUAGE_MAX, "Слишком длинное название языка"),
  test_cases: z
    .array(codeTestCaseSchema)
    .max(TEST_CASES_MAX, `Не более ${TEST_CASES_MAX} тестовых случаев`),
})

export const CODE_LANGUAGES: { value: string; label: string }[] = [
  { value: "python", label: "Python" },
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "go", label: "Go" },
]

export const quizSingleBlockPayloadSchema = z
  .object({
    options: z
      .array(quizOptionSchema)
      .min(QUIZ_OPTIONS_MIN, `Добавьте хотя бы ${QUIZ_OPTIONS_MIN} варианта`)
      .max(QUIZ_OPTIONS_MAX, `Не более ${QUIZ_OPTIONS_MAX} вариантов`),
    correct_option_id: z.number().int(),
  })
  .superRefine((data, ctx) => {
    if (!data.options.some((option) => option.id === data.correct_option_id)) {
      ctx.addIssue({
        code: "custom",
        path: ["correct_option_id"],
        message: "Правильный ответ не найден среди вариантов",
      })
    }
  })

export const quizMultipleBlockPayloadSchema = z
  .object({
    options: z
      .array(quizOptionSchema)
      .min(QUIZ_OPTIONS_MIN, `Добавьте хотя бы ${QUIZ_OPTIONS_MIN} варианта`)
      .max(QUIZ_OPTIONS_MAX, `Не более ${QUIZ_OPTIONS_MAX} вариантов`),
    correct_option_ids: z
      .array(z.number().int())
      .min(1, "Отметьте хотя бы один правильный вариант"),
  })
  .superRefine((data, ctx) => {
    const optionIds = new Set(data.options.map((option) => option.id))
    for (const id of data.correct_option_ids) {
      if (!optionIds.has(id)) {
        ctx.addIssue({
          code: "custom",
          path: ["correct_option_ids"],
          message: `Вариант ${id} не найден среди вариантов`,
        })
        break
      }
    }
  })

export const imageBlockPayloadSchema = z.object({
  url: z.string().max(URL_MAX, "Слишком длинная ссылка").nullable().optional(),
  media_id: z.string().nullable().optional(),
  alt_text: z
    .string()
    .max(ALT_TEXT_MAX, `Alt-текст не должен превышать ${ALT_TEXT_MAX} символов`)
    .nullable()
    .optional(),
})

export const videoBlockPayloadSchema = z.object({
  url: z.string().max(URL_MAX, "Слишком длинная ссылка").nullable().optional(),
  media_id: z.string().nullable().optional(),
  duration: z.number().int().nonnegative().nullable().optional(),
})

export const audioBlockPayloadSchema = z.object({
  url: z.string().max(URL_MAX, "Слишком длинная ссылка").nullable().optional(),
  media_id: z.string().nullable().optional(),
})

export const fileBlockPayloadSchema = z.object({
  url: z.string().max(URL_MAX, "Слишком длинная ссылка").nullable().optional(),
  media_id: z.string().nullable().optional(),
  file_name: z
    .string()
    .max(255, "Имя файла не должно превышать 255 символов")
    .nullable()
    .optional(),
  file_size: z.number().int().nonnegative().nullable().optional(),
})

// --- TYPES ---

export type TextBlockPayload = z.infer<typeof textBlockPayloadSchema>
export type CodeTestCase = z.infer<typeof codeTestCaseSchema>
export type CodeBlockPayload = z.infer<typeof codeBlockPayloadSchema>
export type QuizSingleBlockPayload = z.infer<typeof quizSingleBlockPayloadSchema>
export type QuizMultipleBlockPayload = z.infer<typeof quizMultipleBlockPayloadSchema>
export type ImageBlockPayload = z.infer<typeof imageBlockPayloadSchema>
export type VideoBlockPayload = z.infer<typeof videoBlockPayloadSchema>
export type AudioBlockPayload = z.infer<typeof audioBlockPayloadSchema>
export type FileBlockPayload = z.infer<typeof fileBlockPayloadSchema>

export type BlockTypeToPayload = {
  text: TextBlockPayload
  quiz_single_choice: QuizSingleBlockPayload
  quiz_multiple_choice: QuizMultipleBlockPayload
  code: CodeBlockPayload
  image: ImageBlockPayload
  video: VideoBlockPayload
  audio: AudioBlockPayload
  file: FileBlockPayload
}

export type BlockPayload = BlockTypeToPayload[keyof BlockTypeToPayload]

export const BLOCK_PAYLOAD_SCHEMAS = {
  [BlockType.TEXT]: textBlockPayloadSchema,
  [BlockType.QUIZ_SINGLE_CHOICE]: quizSingleBlockPayloadSchema,
  [BlockType.QUIZ_MULTIPLE_CHOICE]: quizMultipleBlockPayloadSchema,
  [BlockType.CODE]: codeBlockPayloadSchema,
  [BlockType.IMAGE]: imageBlockPayloadSchema,
  [BlockType.VIDEO]: videoBlockPayloadSchema,
  [BlockType.AUDIO]: audioBlockPayloadSchema,
  [BlockType.FILE]: fileBlockPayloadSchema,
} satisfies Record<BlockType, z.ZodType>

// --- DEFAULTS / HELPERS ---

export const MEDIA_BLOCK_TYPES: BlockType[] = [
  BlockType.IMAGE,
  BlockType.VIDEO,
  BlockType.AUDIO,
  BlockType.FILE,
]

export const BLOCK_TYPE_OPTIONS: { value: BlockType; label: string }[] = [
  { value: BlockType.TEXT, label: "Текст" },
  { value: BlockType.CODE, label: "Код" },
  { value: BlockType.QUIZ_SINGLE_CHOICE, label: "Тест (один вариант)" },
  { value: BlockType.QUIZ_MULTIPLE_CHOICE, label: "Тест (несколько вариантов)" },
  { value: BlockType.IMAGE, label: "Изображение" },
  { value: BlockType.VIDEO, label: "Видео" },
  { value: BlockType.AUDIO, label: "Аудио" },
  { value: BlockType.FILE, label: "Файл" },
]

export const DEFAULT_PAYLOADS: Record<BlockType, BlockPayload> = {
  [BlockType.TEXT]: { text: "", html: "" },
  [BlockType.CODE]: { code: "", language: "python", test_cases: [] },
  [BlockType.QUIZ_SINGLE_CHOICE]: {
    options: [
      { id: 1, text: "Вариант 1" },
      { id: 2, text: "Вариант 2" },
    ],
    correct_option_id: 1,
  },
  [BlockType.QUIZ_MULTIPLE_CHOICE]: {
    options: [
      { id: 1, text: "Вариант 1" },
      { id: 2, text: "Вариант 2" },
    ],
    correct_option_ids: [1],
  },
  [BlockType.IMAGE]: { url: "", alt_text: null, media_id: null },
  [BlockType.VIDEO]: { url: "", duration: null, media_id: null },
  [BlockType.AUDIO]: { url: "", media_id: null },
  [BlockType.FILE]: { url: "", file_name: "", file_size: 0, media_id: null },
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

export function createEmptyPayload(blockType: BlockType): BlockPayload {
  return clone(DEFAULT_PAYLOADS[blockType])
}

/**
 * Возвращает валидный payload для типа. Если входящие данные прошли валидацию —
 * возвращает их (лишние ключи отбрасываются). Иначе — дефолт, дополненный
 * сохранившимися данными, чтобы не терять частично заполненный контент.
 */
export function normalizePayload(blockType: BlockType, payload: unknown): BlockPayload {
  const parsed = BLOCK_PAYLOAD_SCHEMAS[blockType].safeParse(payload)
  if (parsed.success) {
    return parsed.data
  }
  return {
    ...createEmptyPayload(blockType),
    ...(payload as Record<string, unknown>),
  } as BlockPayload
}

/**
 * Строит payload нового типа при смене типа блока. Между медиа-типами
 * переносится общий `url`.
 */
export function migratePayload(
  fromType: BlockType,
  fromPayload: unknown,
  toType: BlockType,
): BlockPayload {
  const next = createEmptyPayload(toType)

  if (MEDIA_BLOCK_TYPES.includes(fromType) && MEDIA_BLOCK_TYPES.includes(toType)) {
    const candidate = next as { url?: string; media_id?: string | null }
    const from = fromPayload as
      | { url?: unknown; media_id?: unknown }
      | null
      | undefined
    candidate.url = typeof from?.url === "string" ? from.url : ""
    candidate.media_id = typeof from?.media_id === "string" ? from.media_id : null
  }

  return next
}
