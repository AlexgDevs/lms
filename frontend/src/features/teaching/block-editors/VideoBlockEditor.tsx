import { Input } from "@/components/ui/input"
import { VIDEO_TYPES, resolveMediaUrl } from "@/lib/media"
import { MediaUploadControl } from "@/features/teaching/components/MediaUploadControl"
import type { VideoBlockPayload } from "@/features/teaching/schemas/block"

interface VideoBlockEditorProps {
  payload: VideoBlockPayload
  onChange: (payload: VideoBlockPayload) => void
  onUploadMedia?: (file: File) => Promise<unknown>
  isUploading?: boolean
}

export function VideoBlockEditor({
  payload,
  onChange,
  onUploadMedia,
  isUploading,
}: VideoBlockEditorProps) {
  return (
    <div className="space-y-2">
      {onUploadMedia && (
        <MediaUploadControl
          accept="video/*"
          allowedTypes={VIDEO_TYPES}
          label="Загрузить видео"
          isUploading={isUploading}
          onFile={onUploadMedia}
        />
      )}

      {payload.url && (
        <video
          src={resolveMediaUrl(payload.url)}
          controls
          className="max-h-40 rounded-lg border bg-muted/20"
        />
      )}

      <Input
        type="number"
        value={payload.duration ?? ""}
        onChange={(e) =>
          onChange({ ...payload, duration: e.target.value ? Number(e.target.value) : null })
        }
        placeholder="Длительность (сек, опционально)"
        className="text-xs"
      />
    </div>
  )
}
