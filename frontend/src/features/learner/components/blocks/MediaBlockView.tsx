import type { BlockSchema } from "@/client"
import { resolveMediaUrl } from "@/lib/media"

export function MediaBlockView({ block }: { block: BlockSchema }) {
  const payload = block.payload ?? {}
  const url = resolveMediaUrl(typeof payload.url === "string" ? payload.url : null)
  const altText =
    typeof payload.alt_text === "string" && payload.alt_text ? payload.alt_text : block.title

  switch (block.block_type) {
    case "image":
      return url ? (
        <figure className="space-y-2">
          <img
            src={url}
            alt={altText}
            className="w-full rounded-xl object-contain"
          />
          {altText && (
            <figcaption className="text-xs text-muted-foreground">{altText}</figcaption>
          )}
        </figure>
      ) : (
        <p className="text-sm text-muted-foreground">Изображение недоступно.</p>
      )

    case "video":
      return url ? (
        <video
          controls
          src={url}
          className="w-full rounded-xl bg-black"
        />
      ) : (
        <p className="text-sm text-muted-foreground">Видео недоступно.</p>
      )

    case "audio":
      return url ? (
        <audio controls src={url} className="w-full" />
      ) : (
        <p className="text-sm text-muted-foreground">Аудио недоступно.</p>
      )

    case "file": {
      const fileName =
        typeof payload.file_name === "string" && payload.file_name
          ? payload.file_name
          : "Скачать файл"
      const fileSize =
        typeof payload.file_size === "number" ? formatSize(payload.file_size) : null
      return url ? (
        <a
          href={url}
          download
          className="inline-flex items-center gap-2 rounded-md bg-secondary/40 px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
        >
          <span aria-hidden>📄</span>
          {fileName}
          {fileSize && <span className="text-xs text-muted-foreground">({fileSize})</span>}
        </a>
      ) : (
        <p className="text-sm text-muted-foreground">Файл недоступен.</p>
      )
    }

    default:
      return null
  }
}

function formatSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} КБ`
  return `${bytes} Б`
}