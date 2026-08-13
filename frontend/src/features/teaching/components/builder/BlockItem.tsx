import { useState } from "react"

import { Loader2, Trash2, GripVertical } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { BlockTypeIcon } from "./BlockTypeIcon"
import { BlockEditor } from "@/features/teaching/block-editors/BlockEditor"
import {
  BLOCK_PAYLOAD_SCHEMAS,
  BLOCK_TYPE_OPTIONS,
  MEDIA_BLOCK_TYPES,
  migratePayload,
  normalizePayload,
  type BlockPayload,
} from "@/features/teaching/schemas/block"
import { BlockType, type BlockSchema } from "@/client"

export interface BlockItemUpdate {
  title?: string
  block_type?: BlockType
  payload?: BlockPayload
}

interface BlockItemProps {
  block: BlockSchema
  index: number
  onUpdate: (blockId: string, data: BlockItemUpdate) => Promise<unknown>
  onDelete: (blockId: string) => Promise<unknown>
  isDeleting: boolean
  onUploadMedia?: (file: File) => Promise<unknown>
  onDragStart?: (e: React.DragEvent) => void
  onDragEnd?: () => void
  onDragOver?: (e: React.DragEvent) => void
  onDrop?: (e: React.DragEvent) => void
  isDragging?: boolean
  isDragOver?: boolean
}

export function BlockItem({
  block,
  index,
  onUpdate,
  onDelete,
  isDeleting,
  onUploadMedia,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  isDragging,
  isDragOver,
}: BlockItemProps) {
  const [title, setTitle] = useState(block.title)
  const [blockType, setBlockType] = useState<BlockType>(block.block_type)
  const [payload, setPayload] = useState<BlockPayload>(() =>
    normalizePayload(block.block_type, block.payload),
  )
  const [isSaving, setIsSaving] = useState(false)
  const [pendingType, setPendingType] = useState<BlockType | null>(null)

  const payloadParse = BLOCK_PAYLOAD_SCHEMAS[blockType].safeParse(payload)
  const isPayloadValid = payloadParse.success
  const payloadError = payloadParse.success
    ? null
    : payloadParse.error.issues[0]?.message

  const handleTypeChange = (nextType: BlockType) => {
    if (nextType === blockType) return
    setPendingType(nextType)
  }

  const handleConfirmTypeChange = () => {
    if (pendingType) {
      setBlockType(pendingType)
      setPayload(migratePayload(blockType, payload, pendingType))
    }
    setPendingType(null)
  }

  const handleSave = async () => {
    if (!isPayloadValid) return

    setIsSaving(true)
    try {
      const typeChanged = blockType !== block.block_type
      let payloadToSave = payloadParse.data
      if (MEDIA_BLOCK_TYPES.includes(blockType)) {
        const mediaPayload = { ...(payloadToSave as unknown as Record<string, unknown>) }
        delete mediaPayload.url
        payloadToSave = mediaPayload as BlockPayload
      }
      await onUpdate(block.id, {
        title,
        ...(typeChanged ? { block_type: blockType } : {}),
        payload: payloadToSave,
      })
    } catch (err) {
      console.error("Ошибка сохранения блока:", err)
    } finally {
      setIsSaving(false)
    }
  }

  const handleUploadMedia = async (file: File) => {
    if (!onUploadMedia) return

    setIsSaving(true)
    try {
      const updated = await onUploadMedia(file)
      if (updated && typeof updated === "object" && "payload" in updated) {
        setPayload(normalizePayload(blockType, (updated as { payload: unknown }).payload))
      }
    } catch (err) {
      console.error("Ошибка загрузки файла:", err)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div
      onDragOver={onDragOver}
      onDrop={onDrop}
      className={`rounded-xl bg-background p-4 space-y-3 shadow-2xs transition-colors ${
        isDragging ? "opacity-40" : isDragOver ? "ring-1 ring-primary/30" : ""
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span
            draggable
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            className="shrink-0 text-muted-foreground/40 hover:text-muted-foreground cursor-grab active:cursor-grabbing select-none"
            title="Перетащите, чтобы изменить порядок"
          >
            <GripVertical size={16} />
          </span>
          <span className="text-xs font-semibold text-muted-foreground">{index + 1}.</span>
          <BlockTypeIcon type={blockType} />
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="h-7 text-xs font-medium max-w-xs bg-transparent"
          />
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <select
            value={blockType}
            onChange={(e) => handleTypeChange(e.target.value as BlockType)}
            className="h-7 text-[11px] rounded-md bg-input/40 px-1.5 text-muted-foreground"
            title="Изменить тип блока"
          >
            {BLOCK_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            onClick={handleSave}
            disabled={isSaving || !isPayloadValid}
          >
            {isSaving && <Loader2 size={12} className="animate-spin mr-1" />}
            Сохранить
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-muted-foreground hover:text-destructive"
            onClick={() => onDelete(block.id)}
            disabled={isDeleting}
          >
            <Trash2 size={14} />
          </Button>
        </div>
      </div>

      {/* Поля редактирования в зависимости от типа блока */}
      <div className="pt-2">
        <BlockEditor
          blockType={blockType}
          payload={payload}
          onChange={setPayload}
          onUploadMedia={onUploadMedia ? handleUploadMedia : undefined}
          isUploading={isSaving}
        />
        {payloadError && (
          <p className="mt-2 text-[11px] text-destructive">{payloadError}</p>
        )}
      </div>

      <Dialog
        open={pendingType !== null}
        onOpenChange={(open) => {
          if (!open) setPendingType(null)
        }}
      >
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Изменить тип блока?</DialogTitle>
            <DialogDescription>
              Текущий контент блока будет сброшен. Это действие нельзя отменить.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingType(null)}>
              Отмена
            </Button>
            <Button onClick={handleConfirmTypeChange}>Изменить</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
