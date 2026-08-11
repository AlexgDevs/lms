import { Input } from "@/components/ui/input"
import { IMAGE_TYPES, resolveMediaUrl } from "@/lib/media"
import { MediaUploadControl } from "@/features/teaching/components/MediaUploadControl"
import type { ImageBlockPayload } from "@/features/teaching/schemas/block"

interface ImageBlockEditorProps {
  payload: ImageBlockPayload
  onChange: (payload: ImageBlockPayload) => void
  onUploadMedia?: (file: File) => Promise<unknown>
  isUploading?: boolean
}

export function ImageBlockEditor({
  payload,
  onChange,
  onUploadMedia,
  isUploading,
}: ImageBlockEditorProps) {
  return (
    <div className="space-y-2">
      {onUploadMedia && (
        <MediaUploadControl
          accept="image/*"
          allowedTypes={IMAGE_TYPES}
          label="Загрузить изображение"
          isUploading={isUploading}
          onFile={onUploadMedia}
        />
      )}

      {payload.url && (
        <img
          src={resolveMediaUrl(payload.url)}
          alt={payload.alt_text ?? ""}
          className="max-h-40 rounded-lg border object-contain bg-muted/20"
        />
      )}

      <Input
        value={payload.alt_text ?? ""}
        onChange={(e) => onChange({ ...payload, alt_text: e.target.value })}
        placeholder="Альтернативный текст (alt)"
        className="text-xs"
      />
    </div>
  )
}
