import { AUDIO_TYPES, resolveMediaUrl } from "@/lib/media"
import { MediaUploadControl } from "@/features/teaching/components/MediaUploadControl"
import type { AudioBlockPayload } from "@/features/teaching/schemas/block"

interface AudioBlockEditorProps {
  payload: AudioBlockPayload
  onUploadMedia?: (file: File) => Promise<unknown>
  isUploading?: boolean
}

export function AudioBlockEditor({
  payload,
  onUploadMedia,
  isUploading,
}: AudioBlockEditorProps) {
  return (
    <div className="space-y-2">
      {onUploadMedia && (
        <MediaUploadControl
          accept="audio/*"
          allowedTypes={AUDIO_TYPES}
          label="Загрузить аудио"
          isUploading={isUploading}
          onFile={onUploadMedia}
        />
      )}

      {payload.url && (
        <audio src={resolveMediaUrl(payload.url)} controls className="w-full" />
      )}
    </div>
  )
}
