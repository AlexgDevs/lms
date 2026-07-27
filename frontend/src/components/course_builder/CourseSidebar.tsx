import { useState } from "react"
import { 
  ChevronRight, 
  ChevronDown, 
  Plus, 
  GripVertical, 
  Folder, 
  FileText, 
  Layers 
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"

// Моковые типы для будущей структуры
interface Lesson {
  id: string
  title: string
}

interface Module {
  id: string
  title: string
  lessons: Lesson[]
}

const MOCK_MODULES: Module[] = [
  {
    id: "mod-1",
    title: "Модуль 1: Введение и основы",
    lessons: [
      { id: "les-1", title: "Урок 1.1: Настройка окружения" },
      { id: "les-2", title: "Урок 1.2: Архитектура приложения" },
    ],
  },
  {
    id: "mod-2",
    title: "Модуль 2: Работа с БД",
    lessons: [
      { id: "les-3", title: "Урок 2.1: Проектирование схемы" },
      { id: "les-4", title: "Урок 2.2: Миграции и Alembic" },
    ],
  },
]

interface CourseSidebarProps {
  selectedId: string | null
  onSelect: (id: string, type: "module" | "lesson") => void
}

export function CourseSidebar({ selectedId, onSelect }: CourseSidebarProps) {
  // Храним ID развернутых модулей
  const [openModules, setOpenModules] = useState<Record<string, boolean>>({
    "mod-1": true,
    "mod-2": true,
  })

  const toggleModule = (id: string) => {
    setOpenModules((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <aside className="w-80 shrink-0 border border-border/60 bg-card rounded-2xl flex flex-col h-[calc(100vh-140px)] overflow-hidden shadow-sm">
      {/* Шапка сайдбара */}
      <div className="p-3.5 border-b border-border/60 flex items-center justify-between bg-muted/20">
        <div className="flex items-center gap-2">
          <Layers size={16} className="text-primary" />
          <span className="font-semibold text-xs tracking-wider uppercase">
            Структура курса
          </span>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-7 text-xs rounded-lg gap-1 border-border/60"
        >
          <Plus size={13} />
          Модуль
        </Button>
      </div>

      {/* Дерево модулей и уроков */}
      <ScrollArea className="flex-1 p-2">
        <div className="space-y-1">
          {MOCK_MODULES.map((module) => {
            const isOpen = openModules[module.id]
            const isModuleSelected = selectedId === module.id

            return (
              <div key={module.id} className="space-y-0.5">
                {/* Элемент Модуля */}
                <div
                  className={`group flex items-center gap-1.5 px-2 py-1.5 rounded-xl text-xs font-medium cursor-pointer transition-colors ${
                    isModuleSelected
                      ? "bg-primary/10 text-primary font-semibold"
                      : "hover:bg-muted/50 text-foreground"
                  }`}
                  onClick={() => onSelect(module.id, "module")}
                >
                  <GripVertical
                    size={14}
                    className="text-muted-foreground/30 opacity-0 group-hover:opacity-100 cursor-grab shrink-0 transition-opacity"
                  />
                  
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleModule(module.id)
                    }}
                    className="p-0.5 rounded hover:bg-muted text-muted-foreground"
                  >
                    {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </button>

                  <Folder size={15} className="text-amber-500 shrink-0" />
                  <span className="truncate flex-1">{module.title}</span>

                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-5 w-5 opacity-0 group-hover:opacity-100 shrink-0 rounded"
                    title="Добавить урок"
                  >
                    <Plus size={12} />
                  </Button>
                </div>

                {/* Уроки внутри модуля */}
                {isOpen && (
                  <div className="pl-6 space-y-0.5 border-l border-border/40 ml-4 my-0.5">
                    {module.lessons.map((lesson) => {
                      const isLessonSelected = selectedId === lesson.id

                      return (
                        <div
                          key={lesson.id}
                          onClick={() => onSelect(lesson.id, "lesson")}
                          className={`group flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition-colors ${
                            isLessonSelected
                              ? "bg-primary/10 text-primary font-medium"
                              : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                          }`}
                        >
                          <GripVertical
                            size={13}
                            className="text-muted-foreground/30 opacity-0 group-hover:opacity-100 cursor-grab shrink-0 transition-opacity"
                          />
                          <FileText size={14} className="shrink-0 text-blue-500/80" />
                          <span className="truncate flex-1">{lesson.title}</span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </ScrollArea>
    </aside>
  )
}