import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { useCategoryTree } from "@/features/dashboard/api/useCategories";

interface CategoryChipsProps {
  activeSlug?: string;
  className?: string;
}

export function CategoryChips({ activeSlug, className }: CategoryChipsProps) {
  const { tree } = useCategoryTree();

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <Link
        to="/catalog"
        search={{}}
        className={cn(
          "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
          !activeSlug
            ? "bg-primary text-primary-foreground"
            : "bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground"
        )}
      >
        Все
      </Link>
      {tree.map((category) => {
        const active = activeSlug === category.slug;
        return (
          <Link
            key={category.slug}
            to="/catalog"
            search={{ category: category.slug }}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : "bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {category.icon && <span>{category.icon}</span>}
            {category.name}
          </Link>
        );
      })}
    </div>
  );
}
