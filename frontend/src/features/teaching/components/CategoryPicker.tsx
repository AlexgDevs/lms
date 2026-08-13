import { useState } from "react"
import { Check, ChevronDown, Loader2, X } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useCategoryById, useCategoryTree } from "@/features/dashboard/api/useCategories"

interface CategoryPickerProps {
  value?: string | null
  onChange: (categoryId: string | null) => void
  disabled?: boolean
  placeholder?: string
}

export function CategoryPicker({
  value,
  onChange,
  disabled,
  placeholder = "Без категории",
}: CategoryPickerProps) {
  const [open, setOpen] = useState(false)
  const { tree, categories } = useCategoryTree()
  const current = useCategoryById(value)

  const currentParent = current?.parent_id
    ? categories.find((category) => category.id === current.parent_id)
    : undefined

  const handleSelect = (categoryId: string) => {
    onChange(categoryId)
    setOpen(false)
  }

  const handleClear = () => {
    onChange(null)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className="w-full h-9 justify-between rounded-xl px-3 text-sm font-normal"
        >
          {current ? (
            <span className="flex items-center gap-1.5 truncate">
              {current.icon && <span>{current.icon}</span>}
              <span className="truncate">{current.name}</span>
              {currentParent && (
                <span className="text-muted-foreground/60">· {currentParent.name}</span>
              )}
            </span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
        </Button>
      </PopoverTrigger>

      <PopoverContent align="start" className="w-[min(92vw,960px)] p-0 bg-card">
        {categories.length === 0 ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
          </div>
        ) : (
          <div className="p-3">
            <div className="flex items-center justify-between gap-2 pb-2">
              <p className="text-sm font-semibold text-foreground">
                Выберите категорию курса
              </p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="h-7 rounded-full text-xs text-muted-foreground"
              >
                <X className="w-3.5 h-3.5" />
                Без категории
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-3 max-h-[65vh] overflow-y-auto pr-1">
              {tree.map((block) => (
                <div key={block.id} className="flex flex-col gap-0.5">
                  <button
                    type="button"
                    onClick={() => handleSelect(block.id)}
                    className={cn(
                      "flex items-center justify-between gap-1.5 rounded-lg px-2 py-1.5 text-left text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer",
                      value === block.id
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <span className="flex items-center gap-1.5 truncate">
                      {block.icon && <span>{block.icon}</span>}
                      <span className="truncate">{block.name}</span>
                    </span>
                    {value === block.id && (
                      <Check className="w-3.5 h-3.5 shrink-0 text-primary" />
                    )}
                  </button>

                  {block.children.map((child) => (
                    <button
                      key={child.id}
                      type="button"
                      onClick={() => handleSelect(child.id)}
                      className={cn(
                        "flex items-center justify-between gap-1 rounded-lg px-2 py-1.5 text-left text-[13px] transition-colors cursor-pointer",
                        value === child.id
                          ? "bg-primary/10 text-primary font-medium"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <span className="truncate">{child.name}</span>
                      {value === child.id && (
                        <Check className="w-3.5 h-3.5 shrink-0 text-primary" />
                      )}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}