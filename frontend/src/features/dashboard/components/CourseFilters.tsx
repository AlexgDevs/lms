import { Check, Heart, Languages, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface CourseFiltersProps {
  freeOnly?: boolean;
  onFreeOnlyChange?: (value: boolean) => void;
  certificateOnly?: boolean;
  onCertificateOnlyChange?: (value: boolean) => void;
  className?: string;
}

const COMING_SOON_FILTERS = [
  { label: "RU", icon: Languages },
  { label: "Сгенерировано ИИ", icon: Sparkles },
  { label: "Избранное", icon: Heart },
] as const;

export function CourseFilters({
  freeOnly = false,
  onFreeOnlyChange,
  certificateOnly = false,
  onCertificateOnlyChange,
  className,
}: CourseFiltersProps) {
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {onFreeOnlyChange && (
        <button
          type="button"
          onClick={() => onFreeOnlyChange(!freeOnly)}
          className={cn(
            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer",
            freeOnly
              ? "bg-primary text-primary-foreground"
              : "bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          {freeOnly && <Check className="w-3.5 h-3.5" />}
          Бесплатные
        </button>
      )}

      {onCertificateOnlyChange && (
        <button
          type="button"
          onClick={() => onCertificateOnlyChange(!certificateOnly)}
          className={cn(
            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer",
            certificateOnly
              ? "bg-primary text-primary-foreground"
              : "bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          {certificateOnly && <Check className="w-3.5 h-3.5" />}
          С сертификатом
        </button>
      )}

      {COMING_SOON_FILTERS.map(({ label, icon: Icon }) => (
        <span
          key={label}
          title="Скоро"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-muted/30 text-muted-foreground/50 cursor-not-allowed"
        >
          <Icon className="w-3.5 h-3.5" />
          {label}
        </span>
      ))}
    </div>
  );
}
