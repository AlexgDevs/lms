import { useCallback, useState } from "react"
import { Check, Loader2, FileText, AlertTriangle, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useBlocks } from "@/features/teaching/api/useBlocks"
import { BlockItem, type BlockSaveStatus } from "./BlockItem"
import { BlockCreateForm } from "./BlockCreateForm"
import { BlockType } from "@/client"
import { useReorderableList } from "@/lib/dnd"
import type { BlockPayload } from "@/features/teaching/schemas/block"

interface CourseBlocksProps {
    courseId: string
    lessonId: string | null
}

export function CourseBlocks({ courseId, lessonId }: CourseBlocksProps) {
    const {
        blocks,
        isLoadingBlocks,
        createBlockAsync,
        isCreatingBlock,
        updateBlockAsync,
        deleteBlockAsync,
        isDeletingBlock,
        reorderBlocksAsync,
        isReordering,
        uploadBlockMediaAsync,
        isUploadingBlockMedia,
    } = useBlocks({
        courseId: courseId || undefined,
        lessonId: lessonId || undefined,
        onlyCreated: true,
    })

    // Переупорядочивание блоков (drag & drop)
    const blockList = useReorderableList(
        blocks || [],
        (orderedIds) => {
            reorderBlocksAsync(orderedIds).catch((e) => {
                console.error("Ошибка при переупорядочивании блоков:", e)
            })
        },
        isReordering,
    )

    const [isAdding, setIsAdding] = useState(false)

    // Статусы автосохранения, ключ — lessonId (смена урока автоматически «сбрасывает» индикатор)
    const [saveStateByLesson, setSaveStateByLesson] = useState<
        Record<string, Record<string, BlockSaveStatus>>
    >({})
    const saveStateKey = lessonId ?? ""
    const saveState = saveStateByLesson[saveStateKey] ?? {}

    const handleSaveState = useCallback(
        (blockId: string, status: BlockSaveStatus) => {
            setSaveStateByLesson((prev) => {
                const key = lessonId ?? ""
                const current = prev[key] ?? {}
                if (current[blockId] === status) return prev
                return { ...prev, [key]: { ...current, [blockId]: status } }
            })
        },
        [lessonId],
    )

    const handleDeleteBlock = useCallback(
        (blockId: string) => {
            setSaveStateByLesson((prev) => {
                const key = lessonId ?? ""
                const current = prev[key]
                if (!current || !(blockId in current)) return prev
                const nextLessons = { ...current }
                delete nextLessons[blockId]
                return { ...prev, [key]: nextLessons }
            })
            return deleteBlockAsync(blockId)
        },
        [lessonId, deleteBlockAsync],
    )

    const statuses = Object.values(saveState)
    const saveStatus: BlockSaveStatus | null = statuses.includes("error")
        ? "error"
        : statuses.includes("saving")
            ? "saving"
            : statuses.includes("saved")
                ? "saved"
                : null

    // Если урок не выбран
    if (!lessonId) {
        return (
            <div className="mx-auto w-full max-w-[760px] px-4 lg:px-6 py-24 text-center text-muted-foreground">
                <FileText size={40} className="mb-3 mx-auto opacity-30" />
                <p className="text-sm font-medium">Выберите урок в боковой панели</p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                    Чтобы просматривать и редактировать содержимое блоков, выберите конкретный урок.
                </p>
            </div>
        )
    }

    const handleCreateBlock = async (
        title: string,
        blockType: BlockType,
        payload: BlockPayload,
        file: File | null,
    ) => {
        const created = await createBlockAsync(title, blockType, payload)
        if (file && created) {
            await uploadBlockMediaAsync(created.id, file, false)
        }
        setIsAdding(false)
    }

    return (
        <div className="mx-auto w-full max-w-[760px] px-4 lg:px-6 pb-24 pt-6">
            {/* Строка управления — тонкая, на белом холсте */}
            <div className="flex items-center justify-between gap-3 pb-4 border-b border-border/60">
                <div>
                    <h2 className="font-semibold text-sm">Содержимое урока</h2>
                    <p className="text-xs text-muted-foreground">Управляйте информационными блоками</p>
                </div>
                <div className="flex items-center gap-3">
                    {saveStatus && (
                        <span
                            className={`flex items-center gap-1 text-[11px] transition-opacity ${
                                saveStatus === "error"
                                    ? "text-destructive"
                                    : "text-muted-foreground"
                            }`}
                        >
                            {saveStatus === "saving" && (
                                <Loader2 size={11} className="animate-spin" />
                            )}
                            {saveStatus === "saved" && <Check size={11} />}
                            {saveStatus === "error" && <AlertTriangle size={11} />}
                            {saveStatus === "saving" && "Сохранение…"}
                            {saveStatus === "saved" && "Сохранено"}
                            {saveStatus === "error" && "Ошибка сохранения"}
                        </span>
                    )}
                    <Button
                        size="sm"
                        className="h-8 text-xs gap-1.5"
                        onClick={() => setIsAdding(true)}
                        disabled={isAdding}
                    >
                        <Plus />
                        Добавить блок
                    </Button>
                </div>
            </div>

            {/* Список блоков — единое монолитное полотно, без разделителей */}
            <div className="space-y-1 pt-2">
                {isLoadingBlocks ? (
                    <div className="flex items-center justify-center py-12 text-muted-foreground gap-2 text-xs">
                        <Loader2 className="animate-spin" size={16} />
                        <span>Загрузка блоков...</span>
                    </div>
                ) : blocks && blocks.length > 0 ? (
                    blocks.map((block, index) => (
                        <BlockItem
                            key={block.id}
                            block={block}
                            index={index}
                            onUpdate={updateBlockAsync}
                            onDelete={handleDeleteBlock}
                            isDeleting={isDeletingBlock}
                            onUploadMedia={(file) => uploadBlockMediaAsync(block.id, file, false)}
                            onSaveStateChange={handleSaveState}
                            onDragStart={(e) => blockList.beginDrag(e, block.id)}
                            onDragEnd={blockList.dragEnd}
                            onDragOver={(e) => blockList.dragOver(e, block.id)}
                            onDrop={(e) => blockList.drop(e, block.id)}
                            isDragging={blockList.draggingId === block.id}
                            isDragOver={
                                blockList.overId === block.id &&
                                blockList.draggingId !== block.id
                            }
                        />
                    ))
                ) : !isAdding ? (
                    <div className="text-center py-16 text-muted-foreground">
                        <p className="text-sm font-medium">В этом уроке пока нет блоков</p>
                        <p className="text-xs text-muted-foreground/70 mt-1">Нажмите «Добавить блок», чтобы начать наполнение.</p>
                    </div>
                ) : null}
            </div>

            {/* Форма добавления нового блока */}
            {isAdding && (
                <div className="pt-4">
                    <BlockCreateForm
                        isCreating={isCreatingBlock || isUploadingBlockMedia}
                        onCreate={handleCreateBlock}
                        onCancel={() => setIsAdding(false)}
                    />
                </div>
            )}
        </div>
    )
}
