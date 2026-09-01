import { FileText } from "lucide-react"

import { FILE_TYPES } from "@/lib/media"
import { MediaUploadControl } from "@/features/teaching/components/MediaUploadControl"
import type { FileBlockPayload } from "@/features/teaching/schemas/block"

interface FileBlockEditorProps {
  payload: FileBlockPayload
  onUploadMedia?: (file: File) => Promise<unknown>
  isUploading?: boolean
}

export function FileBlockEditor({
  payload,
  onUploadMedia,
  isUploading,
}: FileBlockEditorProps) {
  return (
    <div className="space-y-2">
      {onUploadMedia && (
        <MediaUploadControl
          accept=".pdf,.txt,.md,application/pdf,text/plain,text/markdown"
          allowedTypes={FILE_TYPES}
          label="Загрузить файл"
          isUploading={isUploading}
          onFile={onUploadMedia}
        />
      )}

      {payload.url && (
        <div className="flex items-center gap-2 p-2 bg-muted/20 rounded-lg border text-xs">
          <FileText size={14} className="text-muted-foreground shrink-0" />
          <span className="truncate flex-1">{payload.file_name || "Файл"}</span>
          {payload.file_size ? (
            <span className="text-muted-foreground shrink-0">
              {Math.round(payload.file_size / 1024)} KB
            </span>
          ) : null}
        </div>
      )}
    </div>
  )
}
