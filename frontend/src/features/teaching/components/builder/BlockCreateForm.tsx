import { useEffect, useRef, useState } from "react"

import { Loader2, Image as ImageIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { BlockEditor } from "@/features/teaching/block-editors/BlockEditor"
import {
  BLOCK_PAYLOAD_SCHEMAS,
  BLOCK_TYPE_OPTIONS,
  MEDIA_BLOCK_TYPES,
  createEmptyPayload,
  type BlockPayload,
  type ImageBlockPayload,
} from "@/features/teaching/schemas/block"
import {
  AUDIO_TYPES,
  FILE_TYPES,
  IMAGE_TYPES,
  MEDIA_ALLOWED_TYPES,
  VIDEO_TYPES,
  validateMediaFile,
} from "@/lib/media"
import { BlockType } from "@/client"

interface BlockCreateFormProps {
  isCreating: boolean
  onCreate: (
    title: string,
    blockType: BlockType,
    payload: BlockPayload,
    file: File | null,
  ) => Promise<void>
  onCancel: () => void
}

const MEDIA_ALLOWED_BY_TYPE: Partial<Record<BlockType, string[]>> = {
  [BlockType.IMAGE]: IMAGE_TYPES,
  [BlockType.VIDEO]: VIDEO_TYPES,
  [BlockType.AUDIO]: AUDIO_TYPES,
  [BlockType.FILE]: FILE_TYPES,
}

export function BlockCreateForm({ isCreating, onCreate, onCancel }: BlockCreateFormProps) {
  const [title, setTitle] = useState("")
  const [blockType, setBlockType] = useState<BlockType>(BlockType.TEXT)
  const [payload, setPayload] = useState<BlockPayload>(() =>
    createEmptyPayload(BlockType.TEXT),
  )
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState("")
  const [alt, setAlt] = useState("")
  const previewUrlRef = useRef<string>("")

  const isMediaBlock = MEDIA_BLOCK_TYPES.includes(blockType)

  const payloadParse = BLOCK_PAYLOAD_SCHEMAS[blockType].safeParse(payload)
  const payloadError = payloadParse.success
    ? null
    : payloadParse.error.issues[0]?.message
  const isFormValid =
    Boolean(title.trim()) && (isMediaBlock ? Boolean(selectedFile) : payloadParse.success)

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
    }
  }, [])

  const clearFile = () => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
    previewUrlRef.current = ""
    setPreviewUrl("")
    setSelectedFile(null)
    setAlt("")
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const error = validateMediaFile(
      file,
      MEDIA_ALLOWED_BY_TYPE[blockType] ?? MEDIA_ALLOWED_TYPES,
    )
    if (error) {
      e.target.value = ""
      return
    }

    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
    const url = URL.createObjectURL(file)
    previewUrlRef.current = url
    setSelectedFile(file)
    setPreviewUrl(url)
    setAlt(file.name)
    e.target.value = ""
  }

  const handleTypeChange = (type: BlockType) => {
    setBlockType(type)
    setPayload(createEmptyPayload(type))
    clearFile()
  }

  const handleAltChange = (value: string) => {
    setAlt(value)
    setPayload((prev) => ({ ...(prev as ImageBlockPayload), alt_text: value }))
  }

  const resetForm = () => {
    setTitle("")
    setPayload(createEmptyPayload(blockType))
    clearFile()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedTitle = title.trim()
    if (!trimmedTitle || isCreating) return
    if (isMediaBlock && !selectedFile) return
    if (!isMediaBlock && !payloadParse.success) return

    const parsedPayload = !isMediaBlock && payloadParse.success ? payloadParse.data : null
    const submitPayload: BlockPayload = isMediaBlock
      ? (blockType === BlockType.IMAGE ? { alt_text: alt || null } : {})
      : (parsedPayload as BlockPayload)

    await onCreate(trimmedTitle, blockType, submitPayload, isMediaBlock ? selectedFile : null)
    resetForm()
  }

  const accept =
    blockType === BlockType.IMAGE
      ? "image/*"
      : blockType === BlockType.VIDEO
        ? "video/*"
        : blockType === BlockType.AUDIO
          ? "audio/*"
          : "*/*"

  return (
    <form
      onSubmit={handleSubmit}
      className="p-4 rounded-xl bg-primary/5 space-y-3"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-primary">Новый блок</span>
      </div>

      <Input
        placeholder="Название блока (например, Введение)..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="text-xs bg-background"
        autoFocus
      />

      <div className="space-y-1.5">
        <label className="text-[11px] font-medium text-muted-foreground">Тип блока:</label>
        <select
          value={blockType}
          onChange={(e) => handleTypeChange(e.target.value as BlockType)}
          className="w-full h-8 px-2 text-xs rounded-md bg-input/40"
        >
          {BLOCK_TYPE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {!isMediaBlock && (
        <BlockEditor blockType={blockType} payload={payload} onChange={setPayload} />
      )}

      {isMediaBlock && (
        <div className="space-y-2 pt-1">
          <label className="text-[10px] text-muted-foreground font-medium">
            Загрузите файл (обязательно):
          </label>

          {!previewUrl ? (
            <label className="flex flex-col items-center justify-center h-28 rounded-xl cursor-pointer bg-background/50 hover:bg-muted/40 transition-colors p-2 text-center">
              <ImageIcon size={24} className="text-muted-foreground mb-1 opacity-50" />
              <span className="text-xs font-medium text-foreground">
                Нажмите для выбора файла
              </span>
              <span className="text-[10px] text-muted-foreground mt-0.5">
                Перетащите или выберите файл с устройства
              </span>
              <input
                type="file"
                className="hidden"
                onChange={handleFileChange}
                accept={accept}
              />
            </label>
          ) : (
            <div className="flex items-center gap-3 p-2 bg-background rounded-xl">
              {blockType === BlockType.IMAGE ? (
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-12 h-12 object-cover rounded-md"
                />
              ) : (
                <div className="w-12 h-12 flex items-center justify-center bg-muted rounded-md text-xs font-bold uppercase">
                  {blockType.slice(0, 3)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{selectedFile?.name}</p>
                <p className="text-[10px] text-muted-foreground">
                  {selectedFile ? Math.round(selectedFile.size / 1024) + " KB" : ""}
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="text-xs text-destructive h-7 px-2 hover:bg-destructive/10"
                onClick={clearFile}
              >
                Удалить
              </Button>
            </div>
          )}

          {blockType === BlockType.IMAGE && (
            <Input
              placeholder="Альтернативный текст (alt)"
              value={alt}
              onChange={(e) => handleAltChange(e.target.value)}
              className="text-xs bg-background"
            />
          )}
        </div>
      )}

      {payloadError && (
        <p className="text-[11px] text-destructive">{payloadError}</p>
      )}

      <div className="flex items-center justify-end gap-2 pt-1">
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-7 text-xs"
          onClick={onCancel}
        >
          Отмена
        </Button>
        <Button
          type="submit"
          size="sm"
          className="h-7 text-xs gap-1"
          disabled={isCreating || !isFormValid || (isMediaBlock && !selectedFile)}
        >
          {isCreating && <Loader2 size={12} className="animate-spin" />}
          Создать блок
        </Button>
      </div>
    </form>
  )
}
