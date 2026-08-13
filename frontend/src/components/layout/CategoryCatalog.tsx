import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ChevronDown, LayoutGrid, ChevronRight } from "lucide-react";

// Пример структурированных данных категорий (в будущем заберёшь с бэкенда)
const CATEGORIES = [
  {
    id: "programming",
    title: "Программирование",
    icon: "💻",
    subcategories: [
      { name: "Python", href: "/catalog" },
      { name: "FastAPI & Web", href: "/catalog" },
      { name: "JavaScript / TypeScript", href: "/catalog" },
      { name: "React & Frontend", href: "/catalog" },
      { name: "Базы данных и SQL", href: "/catalog" },
      { name: "Docker & DevOps", href: "/catalog" },
    ],
  },
  {
    id: "math",
    title: "Математика и Физика",
    icon: "📐",
    subcategories: [
      { name: "Высшая математика", href: "/catalog" },
      { name: "Линейная алгебра", href: "/catalog" },
      { name: "Теория вероятностей", href: "/catalog" },
      { name: "Физика", href: "/catalog" },
    ],
  },
  {
    id: "design",
    title: "Дизайн и Графика",
    icon: "🎨",
    subcategories: [
      { name: "UI/UX Дизайн", href: "/catalog" },
      { name: "2D / 3D Иллюстрация", href: "/catalog" },
      { name: "Paint Tool SAI & Цифровой рисунок", href: "/catalog" },
    ],
  },
  {
    id: "gamedev",
    title: "Разработка игр",
    icon: "🎮",
    subcategories: [
      { name: "Unity & C#", href: "/catalog" },
      { name: "Unreal Engine & C++", href: "/catalog" },
      { name: "3D Моделирование", href: "/catalog" },
    ],
  },
];

export function CategoryCatalog() {
  const [open, setOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="rounded-full gap-2 px-3 text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
        >
          <div className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary">
            <LayoutGrid size={15} />
          </div>
          <span className="hidden lg:inline text-sm font-medium">Каталог</span>
          <ChevronDown
            size={14}
            className={`transition-transform duration-200 ${
              open ? "rotate-180 text-primary" : ""
            }`}
          />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        sideOffset={12}
        className="w-[600px] p-0 bg-card overflow-hidden"
      >
        <div className="grid grid-cols-12 min-h-[320px]">
          {/* Левая колонка: Главные категории */}
          <div className="col-span-5 bg-muted/40 p-2 space-y-1">
            <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Категории
            </div>
            {CATEGORIES.map((cat) => {
              const isActive = activeCategory.id === cat.id;
              return (
                <button
                  key={cat.id}
                  onMouseEnter={() => setActiveCategory(cat)}
                  onClick={() => setActiveCategory(cat)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all text-left cursor-pointer ${
                    isActive
                      ? "bg-card text-primary shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-card/50"
                  }`}
                >
                  <span className="flex items-center gap-2.5 truncate">
                    <span>{cat.icon}</span>
                    <span className="truncate">{cat.title}</span>
                  </span>
                  <ChevronRight
                    size={14}
                    className={`shrink-0 transition-opacity ${
                      isActive ? "opacity-100 text-primary" : "opacity-0"
                    }`}
                  />
                </button>
              );
            })}
          </div>

          {/* Правая колонка: Подкатегории текущего направления */}
          <div className="col-span-7 p-4 bg-card flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 pb-3 mb-3">
                <span className="text-lg">{activeCategory.icon}</span>
                <h3 className="font-semibold text-sm text-foreground">
                  {activeCategory.title}
                </h3>
              </div>

              <div className="grid grid-cols-1 gap-1">
                {activeCategory.subcategories.map((sub) => (
                  <Link
                    key={sub.name}
                    to={sub.href}
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-between px-3 py-2 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                  >
                    <span>{sub.name}</span>
                  </Link>
                ))}
              </div>
            </div>

            <div className="pt-3 mt-4">
              <Link
                to={"/catalog" as string}
                onClick={() => setOpen(false)}
                className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
              >
                Все курсы &rarr;
              </Link>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}