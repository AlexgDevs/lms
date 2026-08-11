import { useRef } from "react"

import { Loader2, Upload } from "lucide-react"

import { Button } from "@/components/ui/button"
import { showErrorToast } from "@/lib/toast"
import {
  MEDIA_ALLOWED_TYPES,
  validateMediaFile,
} from "@/lib/media"

interface MediaUploadControlProps {
  accept?: string
  allowedTypes?: string[]
  isUploading?: boolean
  label?: string
  onFile: (file: File) => void
}

export function MediaUploadControl({
  accept = "*/*",
  allowedTypes = MEDIA_ALLOWED_TYPES,
  isUploading = false,
  label = "Загрузить файл",
  onFile,
}: MediaUploadControlProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return

    const error = validateMediaFile(file, allowedTypes)
    if (error) {
      showErrorToast(error)
      return
    }

    onFile(file)
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-1.5 h-8 text-xs"
        disabled={isUploading}
        onClick={() => inputRef.current?.click()}
      >
        {isUploading ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
        {isUploading ? "Загрузка..." : label}
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={handleChange}
      />
    </>
  )
}
