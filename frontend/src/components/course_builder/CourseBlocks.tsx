import { useState } from "react"
import { 
  Plus, 
  Loader2, 
  Trash2, 
  FileText, 
  HelpCircle, 
  Code, 
  Image as ImageIcon, 
  Video, 
  Volume2, 
  File as FileIcon 
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useBlocks } from "@/hooks/useBlocks"
import { QuizSingleBlockEditor } from "./block_editors/QuizSingleBlockEditor"
import { QuizMultipleBlockEditor } from "./block_editors/QuizMultipleBlockEditor"
import { BlockType } from "@/client" // Убедись, что путь к типам верный

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
  } = useBlocks({
    courseId: courseId || undefined,
    lessonId: lessonId || undefined,
    onlyCreated: true,
  })

  const [isAdding, setIsAdding] = useState(false)
  const [newBlockTitle, setNewBlockTitle] = useState("")
  const [newBlockType, setNewBlockType] = useState<BlockType>(BlockType.TEXT)
  
  // Состояния для загрузки файла/медиа при создании
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [filePreviewUrl, setFilePreviewUrl] = useState("")
  const [newBlockAlt, setNewBlockAlt] = useState("")

  // Если урок не выбран
  if (!lessonId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-muted-foreground bg-card rounded-2xl border border-border/60 shadow-sm">
        <FileText size={40} className="mb-2 opacity-30" />
        <p className="text-sm font-medium">Выберите урок в боковой панели</p>
        <p className="text-xs text-muted-foreground/70 mt-1">
          Чтобы просматривать и редактировать содержимое блоков, выберите конкретный урок.
        </p>
      </div>
    )
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setSelectedFile(file)
    setNewBlockAlt(file.name) // Автоматически подставляем имя файла как alt

    // Конвертируем в Data URL (Base64) для превью и сохранения в payload.url
    const reader = new FileReader()
    reader.onloadend = () => {
      setFilePreviewUrl(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleCreateBlock = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedTitle = newBlockTitle.trim()
    if (!trimmedTitle || isCreatingBlock) return

    // Если это медиа-блок, но файл не выбран — прерываем выполнение
    if ([BlockType.IMAGE, BlockType.VIDEO, BlockType.AUDIO, BlockType.FILE].includes(newBlockType) && !filePreviewUrl) {
      return
    }

    let initialPayload: Record<string, any> = {}

    switch (newBlockType) {
      case BlockType.TEXT:
        initialPayload = { text: "" }
        break
      case BlockType.CODE:
        initialPayload = { code: "", language: "python" }
        break
      case BlockType.QUIZ_SINGLE_CHOICE:
        initialPayload = { options: [{ id: 1, text: "Вариант 1" }], correct_option_id: 1 }
        break
      case BlockType.QUIZ_MULTIPLE_CHOICE:
        initialPayload = { 
          options: [{ id: 1, text: "Вариант 1" }], 
          correct_option_ids: [1] 
        }
        break
      case BlockType.IMAGE:
        initialPayload = { url: filePreviewUrl, alt_text: newBlockAlt }
        break
      case BlockType.VIDEO:
      case BlockType.AUDIO:
        initialPayload = { url: filePreviewUrl }
        break
      case BlockType.FILE:
        initialPayload = { url: filePreviewUrl, file_name: selectedFile?.name || "file.txt", file_size: selectedFile?.size || 0 }
        break
      default:
        initialPayload = {}
    }

    try {
      await createBlockAsync(trimmedTitle, newBlockType, initialPayload)
      setNewBlockTitle("")
      setSelectedFile(null)
      setFilePreviewUrl("")
      setNewBlockAlt("")
      setIsAdding(false)
    } catch (err) {
      console.error("Ошибка при создании блока:", err)
    }
  }

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-140px)] bg-card rounded-2xl border border-border/60 shadow-sm overflow-hidden">
      {/* Шапка */}
      <div className="p-4 border-b border-border/60 flex items-center justify-between bg-muted/20">
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
              courseId={courseId}
              lessonId={lessonId}
              onUpdate={updateBlockAsync}
              onDelete={deleteBlockAsync}
              isDeleting={isDeletingBlock}
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
          <form onSubmit={handleCreateBlock} className="p-4 border border-dashed border-primary/40 rounded-xl bg-primary/5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-primary">Новый блок</span>
            </div>
            
            <Input
              placeholder="Название блока (например, Введение)..."
              value={newBlockTitle}
              onChange={(e) => setNewBlockTitle(e.target.value)}
              className="text-xs bg-background"
              autoFocus
            />

            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-muted-foreground">Тип блока:</label>
              <select
                value={newBlockType}
                onChange={(e) => {
                  setNewBlockType(e.target.value as BlockType)
                  setSelectedFile(null)
                  setFilePreviewUrl("")
                  setNewBlockAlt("")
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

            {/* Зона загрузки файла для медиа-блоков */}
            {[BlockType.IMAGE, BlockType.VIDEO, BlockType.AUDIO, BlockType.FILE].includes(newBlockType) && (
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
                      accept={
                        newBlockType === BlockType.IMAGE ? "image/*" :
                        newBlockType === BlockType.VIDEO ? "video/*" :
                        newBlockType === BlockType.AUDIO ? "audio/*" : "*/*"
                      }
                    />
                  </label>
                ) : (
                  <div className="flex items-center gap-3 p-2 bg-background border border-border rounded-xl">
                    {newBlockType === BlockType.IMAGE ? (
                      <img src={filePreviewUrl} alt="Preview" className="w-12 h-12 object-cover rounded-lg border" />
                    ) : (
                      <div className="w-12 h-12 flex items-center justify-center bg-muted rounded-lg text-xs font-bold uppercase">
                        {newBlockType.slice(0, 3)}
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
                      onClick={() => { setSelectedFile(null); setFilePreviewUrl(""); setNewBlockAlt("") }}
                    >
                      Удалить
                    </Button>
                  </div>
                )}

                {newBlockType === BlockType.IMAGE && (
                  <Input
                    placeholder="Альтернативный текст (alt)"
                    value={newBlockAlt}
                    onChange={(e) => setNewBlockAlt(e.target.value)}
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
                onClick={() => setIsAdding(false)}
              >
                Отмена
              </Button>
              <Button
                type="submit"
                size="sm"
                className="h-7 text-xs gap-1"
                disabled={
                  isCreatingBlock || 
                  !newBlockTitle.trim() || 
                  ([BlockType.IMAGE, BlockType.VIDEO, BlockType.AUDIO, BlockType.FILE].includes(newBlockType) && !filePreviewUrl)
                }
              >
                {isCreatingBlock && <Loader2 size={12} className="animate-spin" />}
                Создать блок
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

// Компонент отдельного блока с логикой редактирования в зависимости от его типа
interface BlockItemProps {
  block: any
  index: number
  courseId: string
  lessonId: string
  onUpdate: (blockId: string, data: any) => Promise<any>
  onDelete: (blockId: string) => Promise<any>
  isDeleting: boolean
}

function BlockItem({ block, index, onUpdate, onDelete, isDeleting }: BlockItemProps) {
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

  // Рендер иконки типа блока
  const renderIcon = (type: BlockType) => {
    switch (type) {
      case BlockType.TEXT: return <FileText size={15} className="text-blue-500" />
      case BlockType.CODE: return <Code size={15} className="text-amber-500" />
      case BlockType.QUIZ_SINGLE_CHOICE:
      case BlockType.QUIZ_MULTIPLE_CHOICE: return <HelpCircle size={15} className="text-purple-500" />
      case BlockType.IMAGE: return <ImageIcon size={15} className="text-emerald-500" />
      case BlockType.VIDEO: return <Video size={15} className="text-rose-500" />
      case BlockType.AUDIO: return <Volume2 size={15} className="text-indigo-500" />
      case BlockType.FILE: return <FileIcon size={15} className="text-sky-500" />
      default: return <FileText size={15} className="text-muted-foreground" />
    }
  }

  return (
    <div className="border border-border/60 rounded-xl bg-background p-4 space-y-3 shadow-2xs">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-1">
          <span className="text-xs font-semibold text-muted-foreground">{index + 1}.</span>
          {renderIcon(block.block_type)}
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