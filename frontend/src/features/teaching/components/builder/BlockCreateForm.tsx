import { useState } from "react"
import { Loader2, Image as ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { BlockType } from "@/client"

interface BlockCreateFormProps {
    isCreating: boolean
    onCreate: (title: string, blockType: BlockType, payload: Record<string, any>) => Promise<void>
    onCancel: () => void
}

const MEDIA_BLOCK_TYPES: BlockType[] = [BlockType.IMAGE, BlockType.VIDEO, BlockType.AUDIO, BlockType.FILE]

export function BlockCreateForm({ isCreating, onCreate, onCancel }: BlockCreateFormProps) {
    const [title, setTitle] = useState("")
    const [blockType, setBlockType] = useState<BlockType>(BlockType.TEXT)
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [filePreviewUrl, setFilePreviewUrl] = useState("")
    const [alt, setAlt] = useState("")

    const isMediaBlock = MEDIA_BLOCK_TYPES.includes(blockType)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setSelectedFile(file)
        setAlt(file.name)

        const reader = new FileReader()
        reader.onloadend = () => {
            setFilePreviewUrl(reader.result as string)
        }
        reader.readAsDataURL(file)
    }

    const resetForm = () => {
        setTitle("")
        setSelectedFile(null)
        setFilePreviewUrl("")
        setAlt("")
    }

    const buildPayload = (): Record<string, any> => {
        switch (blockType) {
            case BlockType.TEXT:
                return { text: "" }
            case BlockType.CODE:
                return { code: "", language: "python" }
            case BlockType.QUIZ_SINGLE_CHOICE:
                return { options: [{ id: 1, text: "Вариант 1" }], correct_option_id: 1 }
            case BlockType.QUIZ_MULTIPLE_CHOICE:
                return { options: [{ id: 1, text: "Вариант 1" }], correct_option_ids: [1] }
            case BlockType.IMAGE:
                return { url: filePreviewUrl, alt_text: alt }
            case BlockType.VIDEO:
            case BlockType.AUDIO:
                return { url: filePreviewUrl }
            case BlockType.FILE:
                return {
                    url: filePreviewUrl,
                    file_name: selectedFile?.name || "file.txt",
                    file_size: selectedFile?.size || 0,
                }
            default:
                return {}
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const trimmedTitle = title.trim()
        if (!trimmedTitle || isCreating) return

        if (isMediaBlock && !filePreviewUrl) return

        await onCreate(trimmedTitle, blockType, buildPayload())
        resetForm()
    }

    const accept = blockType === BlockType.IMAGE ? "image/*"
        : blockType === BlockType.VIDEO ? "video/*"
        : blockType === BlockType.AUDIO ? "audio/*" : "*/*"

    return (
        <form onSubmit={handleSubmit} className="p-4 border border-dashed border-primary/40 rounded-xl bg-primary/5 space-y-3">
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
                    onChange={(e) => {
                        setBlockType(e.target.value as BlockType)
                        setSelectedFile(null)
                        setFilePreviewUrl("")
                        setAlt("")
                    }}
                    className="w-full h-8 px-2 text-xs rounded-md border border-input bg-background"
                >
                    <option value={BlockType.TEXT}>Текст</option>
                    <option value={BlockType.CODE}>Код</option>
                    <option value={BlockType.QUIZ_SINGLE_CHOICE}>Тест (один вариант)</option>
                    <option value={BlockType.QUIZ_MULTIPLE_CHOICE}>Тест (несколько вариантов)</option>
                    <option value={BlockType.IMAGE}>Изображение</option>
                    <option value={BlockType.VIDEO}>Видео</option>
                    <option value={BlockType.AUDIO}>Аудио</option>
                    <option value={BlockType.FILE}>Файл</option>
                </select>
            </div>

            {isMediaBlock && (
                <div className="space-y-2 pt-1">
                    <label className="text-[10px] text-muted-foreground font-medium">Загрузите файл (обязательно):</label>

                    {!filePreviewUrl ? (
                        <label className="flex flex-col items-center justify-center h-28 border-2 border-dashed border-input hover:border-primary/60 rounded-xl cursor-pointer bg-background/50 transition-colors p-2 text-center">
                            <ImageIcon size={24} className="text-muted-foreground mb-1 opacity-50" />
                            <span className="text-xs font-medium text-foreground">Нажмите для выбора файла</span>
                            <span className="text-[10px] text-muted-foreground mt-0.5">Перетащите или выберите файл с устройства</span>
                            <input
                                type="file"
                                className="hidden"
                                onChange={handleFileChange}
                                accept={accept}
                            />
                        </label>
                    ) : (
                        <div className="flex items-center gap-3 p-2 bg-background border border-border rounded-xl">
                            {blockType === BlockType.IMAGE ? (
                                <img src={filePreviewUrl} alt="Preview" className="w-12 h-12 object-cover rounded-lg border" />
                            ) : (
                                <div className="w-12 h-12 flex items-center justify-center bg-muted rounded-lg text-xs font-bold uppercase">
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
                                onClick={() => { setSelectedFile(null); setFilePreviewUrl(""); setAlt("") }}
                            >
                                Удалить
                            </Button>
                        </div>
                    )}

                    {blockType === BlockType.IMAGE && (
                        <Input
                            placeholder="Альтернативный текст (alt)"
                            value={alt}
                            onChange={(e) => setAlt(e.target.value)}
                            className="text-xs bg-background"
                        />
                    )}
                </div>
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
                    disabled={
                        isCreating ||
                        !title.trim() ||
                        (isMediaBlock && !filePreviewUrl)
                    }
                >
                    {isCreating && <Loader2 size={12} className="animate-spin" />}
                    Создать блок
                </Button>
            </div>
        </form>
    )
}
