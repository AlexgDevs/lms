import { useState } from "react"
import { Loader2, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { BlockTypeIcon } from "./BlockTypeIcon"
import { QuizSingleBlockEditor } from "@/features/teaching/block-editors/QuizSingleBlockEditor"
import { QuizMultipleBlockEditor } from "@/features/teaching/block-editors/QuizMultipleBlockEditor"
import { BlockType } from "@/client"

interface BlockItemProps {
    block: any
    index: number
    onUpdate: (blockId: string, data: any) => Promise<any>
    onDelete: (blockId: string) => Promise<any>
    isDeleting: boolean
}

export function BlockItem({ block, index, onUpdate, onDelete, isDeleting }: BlockItemProps) {
    const [title, setTitle] = useState(block.title)
    const [payload, setPayload] = useState(block.payload || {})
    const [isSaving, setIsSaving] = useState(false)

    const handleSave = async () => {
        setIsSaving(true)
        try {
            await onUpdate(block.id, {
                title,
                payload,
            })
        } catch (err) {
            console.error("Ошибка сохранения блока:", err)
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className="border border-border/60 rounded-xl bg-background p-4 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-1">
                    <span className="text-xs font-semibold text-muted-foreground">{index + 1}.</span>
                    <BlockTypeIcon type={block.block_type} />
                    <Input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="h-7 text-xs font-medium border-transparent hover:border-input focus:border-input transition-colors max-w-xs"
                    />
                </div>
                <div className="flex items-center gap-1">
                    <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                        onClick={handleSave}
                        disabled={isSaving}
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
            <div className="pt-2 border-t border-border/40">
                {block.block_type === BlockType.TEXT && (
                    <div className="space-y-1">
                        <label className="text-[11px] text-muted-foreground font-medium">Текст контента:</label>
                        <Textarea
                            value={payload.text || ""}
                            onChange={(e) => setPayload({ ...payload, text: e.target.value })}
                            placeholder="Введите текст материала..."
                            className="text-xs min-h-[100px]"
                        />
                    </div>
                )}

                {block.block_type === BlockType.CODE && (
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="text-[11px] text-muted-foreground font-medium">Код:</label>
                            <Input
                                value={payload.language || "python"}
                                onChange={(e) => setPayload({ ...payload, language: e.target.value })}
                                placeholder="Язык (python, js...)"
                                className="h-6 text-[11px] w-32"
                            />
                        </div>
                        <Textarea
                            value={payload.code || ""}
                            onChange={(e) => setPayload({ ...payload, code: e.target.value })}
                            placeholder="Напишите исходный код..."
                            className="text-xs font-mono min-h-[100px] bg-muted/30"
                        />
                    </div>
                )}

                {(block.block_type === BlockType.IMAGE ||
                    block.block_type === BlockType.VIDEO ||
                    block.block_type === BlockType.AUDIO ||
                    block.block_type === BlockType.FILE) && (
                    <div className="space-y-2">
                        <label className="text-[11px] text-muted-foreground font-medium">URL медиа/файла:</label>
                        <Input
                            value={payload.url || ""}
                            onChange={(e) => setPayload({ ...payload, url: e.target.value })}
                            placeholder="https://example.com/file.png"
                            className="text-xs"
                        />
                        {block.block_type === BlockType.IMAGE && (
                            <Input
                                value={payload.alt_text || ""}
                                onChange={(e) => setPayload({ ...payload, alt_text: e.target.value })}
                                placeholder="Альтернативный текст (alt)"
                                className="text-xs"
                            />
                        )}
                    </div>
                )}

                {block.block_type === BlockType.QUIZ_SINGLE_CHOICE && (
                    <QuizSingleBlockEditor
                        payload={payload}
                        onChange={(newPayload) => setPayload(newPayload)}
                    />
                )}

                {block.block_type === BlockType.QUIZ_MULTIPLE_CHOICE && (
                    <QuizMultipleBlockEditor
                        payload={payload}
                        onChange={(newPayload) => setPayload(newPayload)}
                    />
                )}
            </div>
        </div>
    )
}
