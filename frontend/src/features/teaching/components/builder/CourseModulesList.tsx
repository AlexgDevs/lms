import React, { useState } from "react"
import { 
  Plus, 
  MoreVertical, 
  Pencil, 
  Trash2, 
  Check, 
  X,
  Loader2,
  Folder,
  ChevronDown,
  ChevronRight,
  GripVertical
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { useModules } from "@/features/teaching/api/useModules"
import { CourseLessonsList } from "./CourseLessonsList"
import { useReorderableList } from "@/lib/dnd"

interface Module {
  id: string
  title: string
}

interface CourseModulesListProps {
  courseId: string
  activeModuleId?: string
  activeLessonId?: string
  onSelectModule?: (moduleId: string) => void
  onSelectLesson?: (moduleId: string, lessonId: string) => void
}

const MAX_MODULE_TITLE_LENGTH = 17

function truncateTitle(title: string): string {
  return title.length > MAX_MODULE_TITLE_LENGTH
    ? `${title.slice(0, MAX_MODULE_TITLE_LENGTH).trimEnd()}...`
    : title
}

export const CourseModulesList: React.FC<CourseModulesListProps> = ({
  courseId,
  activeModuleId,
  activeLessonId,
  onSelectModule,
  onSelectLesson,
}) => {
  const { 
    modules, 
    isLoadingModules, 
    createModuleAsync, 
    updateModuleAsync, 
    deleteModuleAsync,
    reorderModulesAsync,
    isCreating,
    isDeleting,
    isReordering
  } = useModules({ courseId, onlyCreated: true })

  // Переупорядочивание модулей (drag & drop)
  const moduleList = useReorderableList(
    (modules as Module[]) || [],
    (orderedIds) => {
      reorderModulesAsync(orderedIds).catch((e) => {
        console.error("Ошибка при переупорядочивании модулей:", e)
      })
    },
    isReordering,
  )

  // Стейт открытых аккордеонов модулей
  const [expandedModuleIds, setExpandedModuleIds] = useState<Record<string, boolean>>({})

  // Стейт модуля, в котором нажали "+" для быстрого создания урока
  const [addingLessonModuleId, setAddingLessonModuleId] = useState<string | null>(null)

  // Стейты для создания модуля
  const [isCreatingNew, setIsCreatingNew] = useState(false)
  const [newTitle, setNewTitle] = useState("")

  // Стейты для редактирования модуля
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState("")

  const toggleExpand = (moduleId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    setExpandedModuleIds((prev) => ({
      ...prev,
      [moduleId]: !prev[moduleId],
    }))
  }

  // Клик по "+" внутри конкретного модуля
  const handleAddLessonClick = (moduleId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    // Автоматом раскрываем модуль
    setExpandedModuleIds((prev) => ({ ...prev, [moduleId]: true }))
    // Активируем форму создания урока
    setAddingLessonModuleId(moduleId)
  }

  const handleCreateModule = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    
    const trimmed = newTitle.trim()
    if (!trimmed || isCreating) return

    try {
      const newMod = await createModuleAsync({ title: trimmed })
      setNewTitle("")
      setIsCreatingNew(false)
      if (newMod?.id) {
        setExpandedModuleIds((prev) => ({ ...prev, [newMod.id]: true }))
      }
    } catch (e) {
      console.error("Ошибка при создании модуля:", e)
    }
  }

  const handleStartEdit = (moduleId: string, currentTitle: string) => {
    setEditingModuleId(moduleId)
    setEditTitle(currentTitle)
  }

  const handleSaveEdit = async (moduleId: string, e?: React.FormEvent) => {
    if (e) e.preventDefault()

    const trimmed = editTitle.trim()
    if (!trimmed) return

    try {
      await updateModuleAsync(moduleId, { title: trimmed })
      setEditingModuleId(null)
    } catch (e) {
      console.error("Ошибка при обновлении модуля:", e)
    }
  }

  // Стейт диалога подтверждения удаления модуля
  const [confirmDeleteModuleId, setConfirmDeleteModuleId] = useState<string | null>(null)

  const handleRequestDeleteModule = (moduleId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setConfirmDeleteModuleId(moduleId)
  }

  const handleDeleteModule = async () => {
    if (!confirmDeleteModuleId) return
    try {
      await deleteModuleAsync(confirmDeleteModuleId)
    } catch (e) {
      console.error("Ошибка при удалении модуля:", e)
    } finally {
      setConfirmDeleteModuleId(null)
    }
  }

  if (isLoadingModules) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-muted-foreground gap-2 text-xs">
        <Loader2 className="animate-spin" size={16} />
        <span>Загрузка модулей...</span>
      </div>
    )
  }

  return (
    <div className="w-full space-y-3">
      {/* Шапка секции */}
      <div className="flex items-center justify-between px-2">
        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Модули курса ({modules?.length || 0})
        </span>
        {!isCreatingNew && (
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-6 w-6 rounded-md"
            onClick={() => setIsCreatingNew(true)}
            title="Добавить модуль"
          >
            <Plus size={15} />
          </Button>
        )}
      </div>

      {/* Список модулей */}
      <div className="space-y-2">
        {(modules as Module[])?.map((module, index) => {
          const isEditing = editingModuleId === module.id
          const isActive = activeModuleId === module.id
          const isExpanded = Boolean(expandedModuleIds[module.id])

          return (
            <div
              key={module.id}
              onDragOver={(e) => moduleList.dragOver(e, module.id)}
              onDrop={(e) => moduleList.drop(e, module.id)}
              className={`rounded-xl transition-colors overflow-hidden shadow-[var(--shadow-card)] ${
                moduleList.draggingId === module.id
                  ? "opacity-40"
                  : moduleList.overId === module.id
                    ? "bg-primary/5 ring-1 ring-primary/30"
                    : isActive
                      ? "bg-primary/5"
                      : "bg-card hover:bg-muted/20"
              }`}
            >
              {/* Шапка модуля */}
              <div 
                className="flex items-center justify-between p-2.5 gap-1.5 cursor-pointer select-none group min-w-0"
                onClick={() => {
                  onSelectModule?.(module.id)
                  if (!isExpanded) {
                    setExpandedModuleIds((prev) => ({ ...prev, [module.id]: true }))
                  }
                }}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span
                    draggable
                    onDragStart={(e) => moduleList.beginDrag(e, module.id)}
                    onDragEnd={moduleList.dragEnd}
                    className="h-5 w-5 shrink-0 flex items-center justify-center text-muted-foreground/40 hover:text-muted-foreground cursor-grab active:cursor-grabbing select-none"
                    title="Перетащите, чтобы изменить порядок"
                  >
                    <GripVertical size={14} />
                  </span>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 shrink-0 text-muted-foreground p-0 hover:bg-muted"
                    onClick={(e) => toggleExpand(module.id, e)}
                  >
                    {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </Button>

                  <Folder size={16} className="text-reward shrink-0" />

                  {isEditing ? (
                    <form 
                      onSubmit={(e) => handleSaveEdit(module.id, e)}
                      className="flex items-center gap-1 flex-1 min-w-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Input
                        className="h-7 text-xs bg-background"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Escape") setEditingModuleId(null)
                        }}
                      />
                      <Button
                        type="submit"
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-success hover:text-success/80 hover:bg-success/10 shrink-0"
                      >
                        <Check size={14} />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-muted-foreground shrink-0"
                        onClick={() => setEditingModuleId(null)}
                      >
                        <X size={14} />
                      </Button>
                    </form>
                  ) : (
                    <span
                      className="text-xs font-semibold truncate flex-1 min-w-0"
                      title={module.title}
                    >
                      {index + 1}. {truncateTitle(module.title)}
                    </span>
                  )}
                </div>

                {!isEditing && (
                  <div className="flex items-center gap-0.5 shrink-0">
                    {/* Кнопка плюсика для быстрого создания урока */}
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 text-muted-foreground hover:text-foreground rounded-md shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => handleAddLessonClick(module.id, e)}
                      title="Добавить урок в модуль"
                    >
                      <Plus size={14} />
                    </Button>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6 text-muted-foreground rounded-md shrink-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreVertical size={14} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40 text-xs">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation()
                            handleStartEdit(module.id, module.title)
                          }}
                          className="gap-2 cursor-pointer"
                        >
                          <Pencil size={13} />
                          Переименовать
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation()
                            handleRequestDeleteModule(module.id, e)
                          }}
                          className="gap-2 cursor-pointer text-destructive focus:text-destructive"
                        >
                          <Trash2 size={13} />
                          Удалить
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}
              </div>

              {/* Уроки модуля */}
              {isExpanded && (
                <div className="bg-muted/10 pb-1">
                  <CourseLessonsList
                    courseId={courseId}
                    moduleId={module.id}
                    selectedLessonId={activeLessonId || null}
                    autoAdd={addingLessonModuleId === module.id}
                    onResetAutoAdd={() => setAddingLessonModuleId(null)}
                    onSelectLesson={(lessonId) => {
                      onSelectModule?.(module.id)
                      onSelectLesson?.(module.id, lessonId)
                    }}
                  />
                </div>
              )}
            </div>
          )
        })}

        {/* Форма создания нового модуля */}
        {isCreatingNew ? (
          <form
            onSubmit={handleCreateModule}
            className="p-2 rounded-xl bg-primary/5 space-y-2"
          >
            <Input
              placeholder="Название нового модуля..."
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="h-7 text-xs bg-background"
              autoFocus
              disabled={isCreating}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  setIsCreatingNew(false)
                  setNewTitle("")
                }
              }}
            />
            <div className="flex items-center justify-end gap-1.5">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-6 text-[11px] px-2"
                disabled={isCreating}
                onClick={() => {
                  setIsCreatingNew(false)
                  setNewTitle("")
                }}
              >
                Отмена
              </Button>
              <Button
                type="submit"
                size="sm"
                className="h-6 text-[11px] px-2.5 gap-1"
                disabled={isCreating || !newTitle.trim()}
              >
                {isCreating && <Loader2 size={11} className="animate-spin" />}
                Создать
              </Button>
            </div>
          </form>
        ) : (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="w-full justify-start text-xs text-primary hover:text-primary hover:bg-primary/5 gap-1.5 rounded-md py-2 bg-muted/30 hover:bg-muted/50"
            onClick={() => setIsCreatingNew(true)}
          >
            <Plus size={14} />
            Добавить модуль
          </Button>
        )}
      </div>

      <ConfirmDialog
        open={confirmDeleteModuleId !== null}
        onOpenChange={(open) => {
          if (!open) setConfirmDeleteModuleId(null)
        }}
        title="Удалить модуль?"
        description="Все уроки и их содержимое будут удалены безвозвратно."
        isConfirming={isDeleting}
        onConfirm={handleDeleteModule}
      />
    </div>
  )
}