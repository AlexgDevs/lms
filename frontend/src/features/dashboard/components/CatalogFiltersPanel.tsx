import { useState } from "react"
import { BadgeCheck, ChevronDown, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useCategoryTree } from "@/features/dashboard/api/useCategories"
import { CatalogRatingFilter } from "./CatalogRatingFilter"
import { cn } from "@/lib/utils"

export type CatalogSort = "popular" | "newest" | "rating"
export type CatalogPrice = "all" | "free" | "paid"

interface CatalogFiltersPanelProps {
  sort: CatalogSort
  onSortChange: (value: CatalogSort) => void
  category?: string
  onCategoryChange: (category?: string) => void
  price: CatalogPrice
  onPriceChange: (value: CatalogPrice) => void
  minRating: number
  onMinRatingChange: (value: number) => void
  certificateOnly: boolean
  onCertificateOnlyChange: (value: boolean) => void
  onReset: () => void
  className?: string
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-border/60 pb-4 mb-4 last:border-0 last:pb-0 last:mb-0">
      <h3 className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h3>
      {children}
    </div>
  )
}

function CollapsibleSection({
  title,
  open,
  onToggle,
  children,
}: {
  title: string
  open: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  return (
    <div className="border-b border-border/60 pb-4 mb-4 last:border-0 last:pb-0 last:mb-0">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between mb-2 cursor-pointer group"
      >
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground group-hover:text-foreground transition-colors">
          {title}
        </h3>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-muted-foreground transition-transform",
            !open && "-rotate-90"
          )}
        />
      </button>
      {open && children}
    </div>
  )
}

export function CatalogFiltersPanel({
  sort,
  onSortChange,
  category,
  onCategoryChange,
  price,
  onPriceChange,
  minRating,
  onMinRatingChange,
  certificateOnly,
  onCertificateOnlyChange,
  onReset,
  className,
}: CatalogFiltersPanelProps) {
  const { tree } = useCategoryTree()
  const [categoriesOpen, setCategoriesOpen] = useState(Boolean(category))

  const priceOptions: Array<{ value: CatalogPrice; label: string }> = [
    { value: "all", label: "Все" },
    { value: "free", label: "Бесплатные" },
    { value: "paid", label: "Платные" },
  ]

  return (
    <div className={cn("rounded-xl bg-card p-4 shadow-[var(--shadow-card)]", className)}>
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-bold text-sm text-foreground">Фильтры</h2>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 -mr-2 text-xs gap-1 text-muted-foreground"
          onClick={onReset}
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Сбросить
        </Button>
      </div>

      <Section title="Сортировка">
        <Select
          value={sort}
          onValueChange={(v) => onSortChange(v as CatalogSort)}
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="Сортировка" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="popular">Популярные</SelectItem>
            <SelectItem value="newest">Сначала новые</SelectItem>
            <SelectItem value="rating">Высокий рейтинг</SelectItem>
          </SelectContent>
        </Select>
      </Section>

      <CollapsibleSection
        title="Категории"
        open={categoriesOpen}
        onToggle={() => setCategoriesOpen((v) => !v)}
      >
        {tree.length === 0 ? (
          <p className="text-xs text-muted-foreground">Категории не найдены</p>
        ) : (
          <div className="space-y-1">
            <CategoryOption
              label="Все категории"
              active={!category}
              onClick={() => onCategoryChange(undefined)}
            />
            {tree.map((parent) => (
              <div key={parent.id} className="space-y-0.5">
                <CategoryOption
                  label={parent.name}
                  active={category === parent.slug}
                  onClick={() => onCategoryChange(parent.slug)}
                />
                {parent.children.length > 0 && (
                  <div className="ml-3 space-y-0.5 border-l border-border/40 pl-2">
                    {parent.children.map((child) => (
                      <CategoryOption
                        key={child.id}
                        label={child.name}
                        active={category === child.slug}
                        onClick={() => onCategoryChange(child.slug)}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CollapsibleSection>

      <Section title="Цена">
        <div className="flex gap-1.5 flex-wrap">
          {priceOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onPriceChange(option.value)}
              className={cn(
                "inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer",
                price === option.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </Section>

      <Section title="Рейтинг">
        <CatalogRatingFilter value={minRating} onChange={onMinRatingChange} />
      </Section>

      <Section title="Особенности">
        <div className="flex items-center gap-2">
          <Checkbox
            id="certificate-filter"
            checked={certificateOnly}
            onCheckedChange={(v) => onCertificateOnlyChange(Boolean(v))}
          />
          <Label
            htmlFor="certificate-filter"
            className="flex items-center gap-1.5 text-xs cursor-pointer"
          >
            <BadgeCheck className="h-3.5 w-3.5 text-reward" />
            С сертификатом
          </Label>
        </div>
      </Section>
    </div>
  )
}

function CategoryOption({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-1.5 text-left text-xs py-1 rounded-md px-2 transition-colors cursor-pointer",
        active
          ? "bg-primary/10 text-primary font-semibold"
          : "text-foreground/80 hover:bg-muted hover:text-foreground"
      )}
    >
      <span className="truncate">{label}</span>
    </button>
  )
}
