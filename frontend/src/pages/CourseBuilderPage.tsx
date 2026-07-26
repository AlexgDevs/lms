import { useState } from "react";
import { 
  Folder, 
  FileText, 
  Video, 
  HelpCircle, 
  Code, 
  Plus, 
  Trash2, 
  GripVertical, 
  ChevronDown, 
  ChevronRight, 
  ArrowLeft,
  Save,
  Eye,
  Layers
} from "lucide-react";

// --- ТИПЫ ДАННЫХ ---
export type BlockType = "text" | "video" | "quiz" | "code";

export interface ContentBlock {
  id: string;
  type: BlockType;
  title: string;
  content: string;
}

export interface Lesson {
  id: string;
  title: string;
  blocks: ContentBlock[];
}

export interface Module {
  id: string;
  title: string;
  isExpanded: boolean;
  lessons: Lesson[];
}

// --- MOCK ДАННЫЕ ---
const INITIAL_STRUCTURE: Module[] = [
  {
    id: "mod-1",
    title: "Модуль 1: Введение и архитектура",
    isExpanded: true,
    lessons: [
      {
        id: "les-1",
        title: "1.1 Обзор FastAPI и Clean Architecture",
        blocks: [
          { id: "blk-1", type: "video", title: "Видео-лекция", content: "https://youtube.com/watch?v=..." },
          { id: "blk-2", type: "text", title: "Конспект урока", content: "Основные принципы SOLID в Python..." },
        ],
      },
      {
        id: "les-2",
        title: "1.2 Настройка окружения и Poetry",
        blocks: [
          { id: "blk-3", type: "code", title: "Практика CLI", content: "poetry init\npoetry add fastapi" },
        ],
      },
    ],
  },
  {
    id: "mod-2",
    title: "Модуль 2: Проектирование Domain слоя",
    isExpanded: false,
    lessons: [
      {
        id: "les-3",
        title: "2.1 Создание сущностей (Entities)",
        blocks: [
          { id: "blk-4", type: "quiz", title: "Тест на знание DDD", content: "Что такое Value Object?" },
        ],
      },
    ],
  },
];

export function CourseBuilderPage() {
  const [modules, setModules] = useState<Module[]>(INITIAL_STRUCTURE);
  
  const [selectedItem, setSelectedItem] = useState<{
    type: "module" | "lesson" | "block";
    moduleId: string;
    lessonId?: string;
    blockId?: string;
  }>({
    type: "lesson",
    moduleId: "mod-1",
    lessonId: "les-1",
  });

  const toggleModule = (modId: string) => {
    setModules((prev) =>
      prev.map((m) => (m.id === modId ? { ...m, isExpanded: !m.isExpanded } : m))
    );
  };

  const currentModule = modules.find((m) => m.id === selectedItem.moduleId);
  const currentLesson = currentModule?.lessons.find((l) => l.id === selectedItem.lessonId);

  const handleAddBlock = (type: BlockType) => {
    if (!selectedItem.lessonId || !currentLesson) return;

    const newBlock: ContentBlock = {
      id: `blk-${Date.now()}`,
      type,
      title: type === "text" ? "Текстовый блок" : type === "video" ? "Видео" : type === "quiz" ? "Тест" : "Код",
      content: "",
    };

    setModules((prev) =>
      prev.map((m) => {
        if (m.id !== selectedItem.moduleId) return m;
        return {
          ...m,
          lessons: m.lessons.map((l) => {
            if (l.id !== selectedItem.lessonId) return l;
            return { ...l, blocks: [...l.blocks, newBlock] };
          }),
        };
      })
    );
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-background text-foreground overflow-hidden antialiased">
      
      {/* 1. TOPBAR */}
      <header className="h-14 border-b border-border/60 bg-card/60 backdrop-blur-md px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="h-4 w-px bg-border" />
          <div>
            <h1 className="text-xs font-semibold text-foreground truncate max-w-xs sm:max-w-md">
              FastAPI + Clean Architecture
            </h1>
            <span className="text-[10px] text-muted-foreground font-medium">Конструктор курса</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/80 bg-background/50 hover:bg-accent text-xs font-medium text-muted-foreground hover:text-foreground transition-all shadow-xs"
          >
            <Eye className="w-3 h-3 opacity-70" />
            <span>Предпросмотр</span>
          </button>
          <button
            type="button"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold shadow-xs transition-colors"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Сохранить</span>
          </button>
        </div>
      </header>

      {/* 2. MAIN LAYOUT */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* ЛЕВАЯ ПАНЕЛЬ (TREE SIDEBAR) */}
        <aside className="w-80 border-r border-border/60 bg-card/30 flex flex-col shrink-0 overflow-hidden">
          
          <div className="p-3 border-b border-border/50 flex items-center justify-between">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-primary" /> Дерево курса
            </span>
            <button
              type="button"
              className="p-1 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
              title="Добавить модуль"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {modules.map((mod) => (
              <div key={mod.id} className="space-y-0.5">
                
                {/* МОДУЛЬ */}
                <div
                  onClick={() => setSelectedItem({ type: "module", moduleId: mod.id })}
                  className={`flex items-center justify-between p-2 rounded-lg text-xs font-semibold transition-all cursor-pointer group ${
                    selectedItem.type === "module" && selectedItem.moduleId === mod.id
                      ? "bg-primary/10 text-primary border border-primary/20"
                      : "text-foreground hover:bg-accent/60"
                  }`}
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleModule(mod.id);
                      }}
                      className="p-0.5 rounded hover:bg-accent text-muted-foreground"
                    >
                      {mod.isExpanded ? (
                        <ChevronDown className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <Folder className="w-3.5 h-3.5 text-primary shrink-0 opacity-80" />
                    <span className="truncate">{mod.title}</span>
                  </div>

                  <button
                    type="button"
                    title="Добавить урок в модуль"
                    className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-primary transition-opacity"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* УРОКИ */}
                {mod.isExpanded && (
                  <div className="pl-3.5 space-y-0.5 border-l border-border/50 ml-3.5 my-1">
                    {mod.lessons.map((les) => (
                      <div key={les.id} className="space-y-0.5">
                        
                        <div
                          onClick={() => setSelectedItem({ type: "lesson", moduleId: mod.id, lessonId: les.id })}
                          className={`flex items-center justify-between p-1.5 px-2 rounded-md text-xs transition-all cursor-pointer group ${
                            selectedItem.type === "lesson" && selectedItem.lessonId === les.id
                              ? "bg-accent font-semibold text-foreground"
                              : "text-muted-foreground hover:text-foreground hover:bg-accent/40"
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <GripVertical className="w-3 h-3 opacity-0 group-hover:opacity-40 cursor-grab shrink-0" />
                            <FileText className="w-3.5 h-3.5 text-muted-foreground/80 shrink-0" />
                            <span className="truncate">{les.title}</span>
                          </div>
                        </div>

                        {/* БЛОКИ */}
                        {selectedItem.lessonId === les.id && (
                          <div className="pl-3 space-y-0.5 border-l border-border/40 ml-3 my-0.5">
                            {les.blocks.map((blk) => (
                              <div
                                key={blk.id}
                                onClick={() => setSelectedItem({ type: "block", moduleId: mod.id, lessonId: les.id, blockId: blk.id })}
                                className={`flex items-center gap-2 p-1 px-2 rounded-md text-[11px] cursor-pointer transition-colors ${
                                  selectedItem.type === "block" && selectedItem.blockId === blk.id
                                    ? "bg-primary/15 text-primary font-medium"
                                    : "text-muted-foreground hover:text-foreground hover:bg-accent/30"
                                }`}
                              >
                                {blk.type === "video" && <Video className="w-3 h-3 opacity-70 shrink-0" />}
                                {blk.type === "text" && <FileText className="w-3 h-3 opacity-70 shrink-0" />}
                                {blk.type === "quiz" && <HelpCircle className="w-3 h-3 opacity-70 shrink-0" />}
                                {blk.type === "code" && <Code className="w-3 h-3 opacity-70 shrink-0" />}
                                <span className="truncate">{blk.title}</span>
                              </div>
                            ))}
                          </div>
                        )}

                      </div>
                    ))}
                  </div>
                )}

              </div>
            ))}
          </div>
        </aside>

        {/* ПРАВАЯ ПАНЕЛЬ */}
        <main className="flex-1 bg-background overflow-y-auto p-6 lg:p-10 max-w-4xl mx-auto space-y-6">
          
          {selectedItem.type === "lesson" && currentLesson && (
            <div className="space-y-6">
              
              {/* Шапка урока */}
              <div className="border-b border-border/60 pb-4">
                <span className="text-[10px] font-bold text-muted-foreground/80 uppercase tracking-wider">
                  Редактирование урока
                </span>
                <input
                  type="text"
                  defaultValue={currentLesson.title}
                  className="w-full bg-transparent text-xl font-bold text-foreground focus:outline-none focus:border-b-2 focus:border-primary transition-all mt-1 pb-1"
                  placeholder="Заголовок урока..."
                />
              </div>

              {/* Список блоков */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Контент урока ({currentLesson.blocks.length})
                  </h3>
                </div>

                {currentLesson.blocks.map((block, index) => (
                  <div
                    key={block.id}
                    className="p-4 rounded-xl border border-border/60 bg-card hover:border-border transition-colors space-y-3 relative group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <GripVertical className="w-4 h-4 text-muted-foreground/40 cursor-grab hover:text-muted-foreground transition-colors" />
                        <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                          {block.type === "text" && <FileText className="w-3.5 h-3.5 text-muted-foreground" />}
                          {block.type === "video" && <Video className="w-3.5 h-3.5 text-muted-foreground" />}
                          {block.type === "code" && <Code className="w-3.5 h-3.5 text-muted-foreground" />}
                          {block.type === "quiz" && <HelpCircle className="w-3.5 h-3.5 text-muted-foreground" />}
                          Блок {index + 1}: {block.title}
                        </span>
                      </div>
                      <button
                        type="button"
                        className="text-muted-foreground/60 hover:text-destructive hover:bg-destructive/10 p-1 rounded-md transition-colors"
                        title="Удалить блок"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Поля ввода */}
                    {block.type === "text" && (
                      <textarea
                        rows={3}
                        defaultValue={block.content}
                        placeholder="Введите текст или Markdown..."
                        className="w-full bg-background border border-border/60 rounded-lg p-3 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary resize-none transition-all"
                      />
                    )}

                    {block.type === "video" && (
                      <input
                        type="text"
                        defaultValue={block.content}
                        placeholder="Вставьте ссылку на видео (VK Video, Youtube, Rutube)..."
                        className="w-full bg-background border border-border/60 rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                      />
                    )}

                    {block.type === "code" && (
                      <textarea
                        rows={4}
                        defaultValue={block.content}
                        placeholder="// Вставьте пример кода..."
                        className="w-full bg-slate-950 border border-border/60 rounded-lg p-3 text-xs font-mono text-emerald-400 placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary resize-none transition-all"
                      />
                    )}
                  </div>
                ))}

                {/* БАР ДОБАВЛЕНИЯ НОВОГО БЛОКА (Единый аккуратный стиль) */}
                <div className="p-5 border border-dashed border-border/80 rounded-xl bg-card/20 flex flex-col items-center justify-center gap-3">
                  <span className="text-xs text-muted-foreground font-medium">
                    Добавить элемент в урок
                  </span>
                  
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    {[
                      { type: "text", label: "Текст", icon: FileText },
                      { type: "video", label: "Видео", icon: Video },
                      { type: "quiz", label: "Тест", icon: HelpCircle },
                      { type: "code", label: "Код", icon: Code },
                    ].map((item) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.type}
                          type="button"
                          onClick={() => handleAddBlock(item.type as BlockType)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/80 bg-card hover:bg-accent hover:border-border text-xs font-medium text-foreground transition-all shadow-2xs active:scale-95"
                        >
                          <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                          <span>+ {item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

              </div>
            </div>
          )}

          {selectedItem.type === "module" && currentModule && (
            <div className="space-y-4">
              <span className="text-[10px] font-bold text-muted-foreground/80 uppercase tracking-wider">
                Настройки модуля
              </span>
              <input
                type="text"
                defaultValue={currentModule.title}
                className="w-full bg-transparent text-xl font-bold text-foreground focus:outline-none focus:border-b-2 focus:border-primary transition-all pb-1"
              />
              <p className="text-xs text-muted-foreground">
                Модуль содержит {currentModule.lessons.length} уроков. Вы можете менять их порядок в левом дереве.
              </p>
            </div>
          )}

        </main>

      </div>

    </div>
  );
}