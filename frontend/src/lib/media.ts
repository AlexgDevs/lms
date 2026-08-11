export const MEDIA_MAX_SIZE_MB = 20

export const IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
  "image/svg+xml",
]

export const VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"]

export const AUDIO_TYPES = ["audio/mpeg", "audio/ogg", "audio/wav"]

export const FILE_TYPES = ["application/pdf", "text/plain", "text/markdown"]

export const MEDIA_ALLOWED_TYPES = [
  ...IMAGE_TYPES,
  ...VIDEO_TYPES,
  ...AUDIO_TYPES,
  ...FILE_TYPES,
]

export function validateMediaFile(file: File, allowedTypes: string[]): string | null {
  if (file.size > MEDIA_MAX_SIZE_MB * 1024 * 1024) {
    return `Файл слишком большой. Максимум ${MEDIA_MAX_SIZE_MB} МБ.`
  }
  if (file.type && !allowedTypes.includes(file.type)) {
    return `Недопустимый тип файла: ${file.type || "неизвестный"}.`
  }
  return null
}

export function resolveMediaUrl(
  url: string | null | undefined,
): string | undefined {
  if (!url) return undefined
  if (/^(https?:|data:|blob:)/i.test(url)) return url
  const baseUrl = import.meta.env.VITE_API_URL as string | undefined
  if (!baseUrl) return url
  return new URL(url, baseUrl).toString()
}
