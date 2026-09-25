import { useEffect, useRef, useState } from "react"

import { Trash2, GripVertical } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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

export type BlockSaveStatus = "saving" | "saved" | "error"

/** Задержка фонового автосохранения после последней правки. */
const AUTOSAVE_DELAY_MS = 900

/**
 * Снапшот локального состояния блока для сравнения с последним сохранённым.
 * У медиа-блоков `url` разрешается сервером и не участвует в сравнении.
 */
function serializeSnapshot(
  title: string,
  blockType: BlockType,
  payload: BlockPayload,
): string {
  let comparable: unknown = payload
  if (MEDIA_BLOCK_TYPES.includes(blockType)) {
    const copy = { ...(payload as Record<string, unknown>) }
    delete copy.url
    comparable = copy
  }
  return JSON.stringify({ title, block_type: blockType, payload: comparable })
}

interface BlockItemProps {
  block: BlockSchema
  index: number
  onUpdate: (blockId: string, data: BlockItemUpdate) => Promise<unknown>
  onDelete: (blockId: string) => Promise<unknown>
  isDeleting: boolean
  onUploadMedia?: (file: File) => Promise<unknown>
  onSaveStateChange?: (blockId: string, status: BlockSaveStatus) => void
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
  onSaveStateChange,
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
  const [isUploading, setIsUploading] = useState(false)
  const [pendingType, setPendingType] = useState<BlockType | null>(null)

  const payloadParse = BLOCK_PAYLOAD_SCHEMAS[blockType].safeParse(payload)
  const isPayloadValid = payloadParse.success
  const payloadError = payloadParse.success
    ? null
    : payloadParse.error.issues[0]?.message

  // --- Фоновое автосохранение (debounce per-block) ---

  const lastSavedRef = useRef(serializeSnapshot(title, blockType, payload))
  const savingRef = useRef(false)
  const queuedRef = useRef(false)
  const latestRef = useRef({ title, blockType, payload, valid: isPayloadValid })
  const saveStateRef = useRef(onSaveStateChange)
  const doSaveRef = useRef<() => Promise<void>>(async () => {})

  useEffect(() => {
    latestRef.current = { title, blockType, payload, valid: isPayloadValid }
  })
  useEffect(() => {
    saveStateRef.current = onSaveStateChange
  })

  const doSave = async () => {
    const latest = latestRef.current
    if (!latest.valid) return
    const parsed = BLOCK_PAYLOAD_SCHEMAS[latest.blockType].safeParse(latest.payload)
    if (!parsed.success) return

    const snapshot = serializeSnapshot(latest.title, latest.blockType, latest.payload)
    if (snapshot === lastSavedRef.current) return
    if (savingRef.current) {
      queuedRef.current = true
      return
    }

    savingRef.current = true
    saveStateRef.current?.(block.id, "saving")
    try {
      let payloadToSave: BlockPayload = parsed.data
      if (MEDIA_BLOCK_TYPES.includes(latest.blockType)) {
        const mediaPayload = {
          ...(payloadToSave as unknown as Record<string, unknown>),
        }
        delete mediaPayload.url
        payloadToSave = mediaPayload as BlockPayload
      }
      await onUpdate(block.id, {
        title: latest.title,
        ...(latest.blockType !== block.block_type
          ? { block_type: latest.blockType }
          : {}),
        payload: payloadToSave,
      })
      lastSavedRef.current = snapshot
      saveStateRef.current?.(block.id, "saved")
    } catch (err) {
      console.error("Ошибка сохранения блока:", err)
      saveStateRef.current?.(block.id, "error")
    } finally {
      savingRef.current = false
      if (queuedRef.current) {
        queuedRef.current = false
        void doSaveRef.current()
      }
    }
  }

  useEffect(() => {
    doSaveRef.current = doSave
  })

  // Debounce: сохраняем через AUTOSAVE_DELAY_MS после последней правки.
  useEffect(() => {
    const snapshot = serializeSnapshot(title, blockType, payload)
    if (snapshot === lastSavedRef.current || !isPayloadValid) return
    const timer = setTimeout(() => {
      void doSaveRef.current()
    }, AUTOSAVE_DELAY_MS)
    return () => clearTimeout(timer)
  }, [title, blockType, payload, isPayloadValid])

  // Флеш незавершённых правок при размонтировании (смена урока, выход).
  useEffect(() => {
    return () => {
      const latest = latestRef.current
      if (!latest.valid) return
      const snapshot = serializeSnapshot(latest.title, latest.blockType, latest.payload)
      if (snapshot === lastSavedRef.current) return
      void doSaveRef.current()
    }
  }, [])

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

  const handleUploadMedia = async (file: File) => {
    if (!onUploadMedia) return

    setIsUploading(true)
    try {
      const updated = await onUploadMedia(file)
      if (updated && typeof updated === "object" && "payload" in updated) {
        const nextPayload = normalizePayload(
          blockType,
          (updated as { payload: unknown }).payload,
        )
        setPayload(nextPayload)
        // Сервер уже сохранил блок вместе с файлом — фиксируем снапшот,
        // чтобы автосохранение не повторяло PATCH без изменений.
        const wasClean =
          serializeSnapshot(latestRef.current.title, blockType, latestRef.current
            .payload) === lastSavedRef.current
        if (wasClean) {
          lastSavedRef.current = serializeSnapshot(
            latestRef.current.title,
            blockType,
            nextPayload,
          )
          saveStateRef.current?.(block.id, "saved")
        }
      }
    } catch (err) {
      console.error("Ошибка загрузки файла:", err)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div
      onDragOver={onDragOver}
      onDrop={onDrop}
      className={`group relative -mx-2 rounded-lg px-2 py-4 transition-colors ${
        isDragging
          ? "opacity-40"
          : isDragOver
            ? "bg-primary/5"
            : "hover:bg-muted/40"
      }`}
    >
      <div className="flex gap-2">
        {/* Левая рейка: номер виден всегда, контролы проявляются при наведении */}
        <div className="flex w-6 shrink-0 flex-col items-center gap-1 pt-1.5">
          <span className="select-none text-[10px] tabular-nums text-muted-foreground/40">
            {index + 1}
          </span>
          <div className="pointer-events-none flex flex-col items-center gap-0.5 opacity-0 transition-opacity duration-150 group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100 max-lg:pointer-events-auto max-lg:opacity-100">
            <span
              draggable
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              className="shrink-0 cursor-grab select-none text-muted-foreground/40 transition-colors hover:text-muted-foreground active:cursor-grabbing"
              title="Перетащите, чтобы изменить порядок"
            >
              <GripVertical size={14} />
            </span>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground/50 transition-colors hover:bg-muted hover:text-foreground"
                  title="Изменить тип блока"
                >
                  <BlockTypeIcon type={blockType} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" side="right" className="w-56">
                {BLOCK_TYPE_OPTIONS.map((option) => (
                  <DropdownMenuItem
                    key={option.value}
                    onSelect={() => handleTypeChange(option.value)}
                    className="gap-2"
                  >
                    <BlockTypeIcon type={option.value} />
                    <span className="text-xs">{option.label}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <button
              type="button"
              className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground/50 transition-colors hover:bg-destructive/10 hover:text-destructive disabled:pointer-events-none disabled:opacity-40"
              onClick={() => onDelete(block.id)}
              disabled={isDeleting}
              title="Удалить блок"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>

        {/* Контент блока — единый документ, без рамок и кнопок */}
        <div className="min-w-0 flex-1">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="h-7 border-transparent bg-transparent px-1.5 text-sm font-medium hover:bg-muted/40 focus:bg-background"
          />
          <div className="pt-3">
            <BlockEditor
              blockType={blockType}
              payload={payload}
              onChange={setPayload}
              onUploadMedia={onUploadMedia ? handleUploadMedia : undefined}
              isUploading={isUploading}
            />
            {payloadError && (
              <p className="mt-2 text-[11px] text-destructive">{payloadError}</p>
            )}
          </div>
        </div>
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
