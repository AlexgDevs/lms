import { useState } from "react"
import { Plus, Loader2, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useBlocks } from "@/features/teaching/api/useBlocks"
import { BlockItem } from "./BlockItem"
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

    // Если урок не выбран
    if (!lessonId) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-muted-foreground bg-card rounded-xl shadow-[var(--shadow-card)]">
                <FileText size={40} className="mb-2 opacity-30" />
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
        <div className="flex-1 min-h-0 flex flex-col bg-card rounded-xl shadow-[var(--shadow-card)] overflow-hidden">
            {/* Шапка */}
            <div className="p-4 flex items-center justify-between bg-muted/20">
                <div>
                    <h2 className="font-semibold text-sm">Содержимое урока</h2>
                    <p className="text-xs text-muted-foreground">Управляйте информационными блоками</p>
                </div>
                <Button
                    size="sm"
                    className="h-8 text-xs gap-1.5"
                    onClick={() => setIsAdding(true)}
                    disabled={isAdding}
                >
                    <Plus size={14} />
                    Добавить блок
                </Button>
            </div>

            {/* Список блоков */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
                            onDelete={deleteBlockAsync}
                            isDeleting={isDeletingBlock}
                            onUploadMedia={(file) => uploadBlockMediaAsync(block.id, file, false)}
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

                {/* Форма добавления нового блока */}
                {isAdding && (
                    <BlockCreateForm
                        isCreating={isCreatingBlock || isUploadingBlockMedia}
                        onCreate={handleCreateBlock}
                        onCancel={() => setIsAdding(false)}
                    />
                )}
            </div>
        </div>
    )
}
