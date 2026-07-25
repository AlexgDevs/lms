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
  Sparkles, 
  ArrowLeft,
  Save,
  Eye,
  Settings,
  Layers
} from "lucide-react";

// --- ТИПЫ ДАННЫХ ---
export type BlockType = "text" | "video" | "quiz" | "code";

export interface ContentBlock {
  id: string;
  type: BlockType;
  title: string;
  content: string; // Заголовок, URL видео, вопрос или код
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

// --- MOCK ДАННЫЕ ДЕРЕВА ---
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
  
  // Текущий выбранный элемент для редактирования справа
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

  // Вспомогательная функция открытия/закрытия модуля
  const toggleModule = (modId: string) => {
    setModules((prev) =>
      prev.map((m) => (m.id === modId ? { ...m, isExpanded: !m.isExpanded } : m))
    );
  };

  // Получаем текущие данные выбранного объекта для правой панели
  const currentModule = modules.find((m) => m.id === selectedItem.moduleId);
  const currentLesson = currentModule?.lessons.find((l) => l.id === selectedItem.lessonId);
  const currentBlock = currentLesson?.blocks.find((b) => b.id === selectedItem.blockId);

  // Добавление нового блока в текущий урок
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
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-background overflow-hidden">
      
      {/* 1. ВЕРХНЯЯ СТРОКА НАВИГАЦИИ (TOPBAR) */}
      <header className="h-14 border-b border-border/50 bg-card px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="h-4 w-[1px] bg-border/60" />
          <div>
            <h1 className="text-xs font-bold text-foreground truncate max-w-xs sm:max-w-md">
              FastAPI + Clean Architecture
            </h1>
            <span className="text-[10px] text-purple-400 font-medium">Конструктор курса</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border/60 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Предпросмотр</span>
          </button>
          <button
            type="button"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Сохранить</span>
          </button>
        </div>
      </header>

      {/* 2. ОСНОВНОЙ СПЛИТ-РАБОЧИЙ СТОЛ */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* ЛЕВАЯ ПАНЕЛЬ: ДЕРЕВО СТРУКТУРЫ (Tree Sidebar) */}
        <aside className="w-80 border-r border-border/50 bg-card/50 flex flex-col shrink-0 overflow-hidden">
          
          <div className="p-3 border-b border-border/40 flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-purple-400" /> Дерево курса
            </span>
            <button
              type="button"
              className="p-1 rounded-lg hover:bg-muted text-purple-400 hover:text-purple-300 transition-colors"
              title="Добавить модуль"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Списочный древовидный контейнер */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {modules.map((mod) => (
              <div key={mod.id} className="space-y-0.5">
                
                {/* ЭЛЕМЕНТ: МОДУЛЬ */}
                <div
                  onClick={() => setSelectedItem({ type: "module", moduleId: mod.id })}
                  className={`flex items-center justify-between p-2 rounded-xl text-xs font-bold transition-colors cursor-pointer group ${
                    selectedItem.type === "module" && selectedItem.moduleId === mod.id
                      ? "bg-purple-500/10 text-purple-300 border border-purple-500/20"
                      : "text-foreground hover:bg-muted/50"
                  }`}
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleModule(mod.id);
                      }}
                      className="p-0.5 rounded hover:bg-muted/80 text-muted-foreground"
                    >
                      {mod.isExpanded ? (
                        <ChevronDown className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <Folder className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    <span className="truncate">{mod.title}</span>
                  </div>

                  <button
                    type="button"
                    title="Добавить урок в модуль"
                    className="opacity-0 group-hover:opacity-100 p-1 hover:text-purple-400 transition-opacity"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* УРОКИ ВНУТРИ МОДУЛЯ */}
                {mod.isExpanded && (
                  <div className="pl-4 space-y-0.5 border-l border-border/40 ml-3 my-1">
                    {mod.lessons.map((les) => (
                      <div key={les.id} className="space-y-0.5">
                        
                        {/* ЭЛЕМЕНТ: УРОК */}
                        <div
                          onClick={() => setSelectedItem({ type: "lesson", moduleId: mod.id, lessonId: les.id })}
                          className={`flex items-center justify-between p-1.5 px-2 rounded-lg text-xs font-medium transition-colors cursor-pointer group ${
                            selectedItem.type === "lesson" && selectedItem.lessonId === les.id
                              ? "bg-purple-500/15 text-purple-300 font-semibold"
                              : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <GripVertical className="w-3 h-3 opacity-0 group-hover:opacity-40 cursor-grab shrink-0" />
                            <FileText className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                            <span className="truncate">{les.title}</span>
                          </div>
                        </div>

                        {/* БЛОКИ ВНУТРИ УРОКА */}
                        {selectedItem.lessonId === les.id && (
                          <div className="pl-4 space-y-0.5 border-l border-border/30 ml-3 my-0.5">
                            {les.blocks.map((blk) => (
                              <div
                                key={blk.id}
                                onClick={() => setSelectedItem({ type: "block", moduleId: mod.id, lessonId: les.id, blockId: blk.id })}
                                className={`flex items-center gap-2 p-1 px-2 rounded-md text-[11px] cursor-pointer transition-colors ${
                                  selectedItem.type === "block" && selectedItem.blockId === blk.id
                                    ? "bg-purple-500/20 text-purple-200 font-medium"
                                    : "text-muted-foreground/80 hover:text-foreground hover:bg-muted/30"
                                }`}
                              >
                                {blk.type === "video" && <Video className="w-3 h-3 text-red-400 shrink-0" />}
                                {blk.type === "text" && <FileText className="w-3 h-3 text-amber-400 shrink-0" />}
                                {blk.type === "quiz" && <HelpCircle className="w-3 h-3 text-emerald-400 shrink-0" />}
                                {blk.type === "code" && <Code className="w-3 h-3 text-cyan-400 shrink-0" />}
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

        {/* ПРАВАЯ ПАНЕЛЬ: РЕДАКТИРОВАНИЕ ВЫБРАННОГО ЭЛЕМЕНТА */}
        <main className="flex-1 bg-background overflow-y-auto p-6 lg:p-10 max-w-4xl mx-auto space-y-6">
          
          {/* 1. РЕДАКТИРОВАНИЕ УРОКА */}
          {selectedItem.type === "lesson" && currentLesson && (
            <div className="space-y-6">
              
              <div className="border-b border-border/50 pb-4">
                <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">
                  Редактирование урока
                </span>
                <input
                  type="text"
                  defaultValue={currentLesson.title}
                  className="w-full bg-transparent text-xl font-bold text-foreground focus:outline-none focus:border-purple-500 mt-1"
                  placeholder="Заголовок урока..."
                />
              </div>

              {/* СПИСОК БЛОКОВ КОНТЕНТА УРОКА */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Контент урока ({currentLesson.blocks.length} блоков)
                </h3>

                {currentLesson.blocks.map((block, index) => (
                  <div
                    key={block.id}
                    className="p-4 rounded-2xl border border-border/60 bg-card space-y-3 relative group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <GripVertical className="w-4 h-4 text-muted-foreground/40 cursor-grab" />
                        <span className="text-xs font-bold text-foreground">
                          Блок {index + 1}: {block.title}
                        </span>
                      </div>
                      <button
                        type="button"
                        className="text-muted-foreground hover:text-red-400 transition-colors p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Поле ввода содержимого в зависимости от типа */}
                    {block.type === "text" && (
                      <textarea
                        rows={3}
                        defaultValue={block.content}
                        placeholder="Введите текст или Markdown..."
                        className="w-full bg-background border border-border/50 rounded-xl p-3 text-xs text-foreground focus:outline-none focus:border-purple-500 resize-none"
                      />
                    )}

                    {block.type === "video" && (
                      <input
                        type="text"
                        defaultValue={block.content}
                        placeholder="Вставьте ссылку на видео (VK Video, Youtube, Rutube)..."
                        className="w-full bg-background border border-border/50 rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-purple-500"
                      />
                    )}

                    {block.type === "code" && (
                      <textarea
                        rows={4}
                        defaultValue={block.content}
                        placeholder="// Код пример..."
                        className="w-full bg-slate-950 border border-border/50 rounded-xl p-3 text-xs font-mono text-emerald-400 focus:outline-none focus:border-purple-500 resize-none"
                      />
                    )}
                  </div>
                ))}

                {/* БАР ДОБАВЛЕНИЯ НОВОГО БЛОКА */}
                <div className="p-4 border-2 border-dashed border-border/60 rounded-2xl bg-card/30 flex flex-col items-center justify-center gap-3">
                  <span className="text-xs text-muted-foreground font-medium">
                    Добавить новый элемент в этот урок:
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleAddBlock("text")}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-medium hover:bg-amber-500/20 transition-colors"
                    >
                      <FileText className="w-3.5 h-3.5" /> + Текст
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddBlock("video")}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 text-xs font-medium hover:bg-red-500/20 transition-colors"
                    >
                      <Video className="w-3.5 h-3.5" /> + Видео
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddBlock("quiz")}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-medium hover:bg-emerald-500/20 transition-colors"
                    >
                      <HelpCircle className="w-3.5 h-3.5" /> + Тест
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddBlock("code")}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-xs font-medium hover:bg-cyan-500/20 transition-colors"
                    >
                      <Code className="w-3.5 h-3.5" /> + Код
                    </button>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* 2. РЕДАКТИРОВАНИЕ МОДУЛЯ */}
          {selectedItem.type === "module" && currentModule && (
            <div className="space-y-4">
              <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">
                Настройки модуля
              </span>
              <input
                type="text"
                defaultValue={currentModule.title}
                className="w-full bg-transparent text-xl font-bold text-foreground focus:outline-none focus:border-purple-500"
              />
              <p className="text-xs text-muted-foreground">
                Модуль содержит {currentModule.lessons.length} уроков. Вы можете перетаскивать порядок уроков в левой панели.
              </p>
            </div>
          )}

        </main>

      </div>

    </div>
  );
}