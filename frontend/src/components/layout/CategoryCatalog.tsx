import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ChevronDown, LayoutGrid, ChevronRight, Loader2 } from "lucide-react";
import { useCategoryTree } from "@/features/dashboard/api/useCategories";

export function CategoryCatalog() {
  const [open, setOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const { tree, categories } = useCategoryTree();
  const navigate = useNavigate();

  const activeCategory =
    tree.find((category) => category.id === activeId) ?? tree[0];

  const goToCategory = (slug: string) => {
    setOpen(false);
    navigate({ to: "/catalog", search: { category: slug } });
  };

  const goToAll = () => {
    setOpen(false);
    navigate({ to: "/catalog", search: {} });
  };

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
        {categories.length === 0 ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-12 min-h-[320px]">
            {/* Левая колонка: Главные категории */}
            <div className="col-span-5 bg-muted/40 p-2 space-y-1">
              <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Категории
              </div>
              {tree.map((cat) => {
                const isActive = activeCategory?.id === cat.id;
                return (
                  <button
                    key={cat.id}
                    onMouseEnter={() => setActiveId(cat.id)}
                    onClick={() => setActiveId(cat.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all text-left cursor-pointer ${
                      isActive
                        ? "bg-card text-primary shadow-sm"
                        : "text-muted-foreground hover:text-foreground hover:bg-card/50"
                    }`}
                  >
                    <span className="flex items-center gap-2.5 truncate">
                      <span className="truncate">{cat.name}</span>
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
                  <h3 className="font-semibold text-sm text-foreground">
                    {activeCategory?.name ?? ""}
                  </h3>
                </div>

                <div className="grid grid-cols-1 gap-1">
                  {activeCategory?.children.map((sub) => (
                    <button
                      key={sub.id}
                      onClick={() => goToCategory(sub.slug)}
                      className="flex items-center justify-between px-3 py-2 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors text-left cursor-pointer"
                    >
                      <span>{sub.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-3 mt-4">
                <button
                  onClick={goToAll}
                  className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                >
                  Все курсы &rarr;
                </button>
              </div>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
