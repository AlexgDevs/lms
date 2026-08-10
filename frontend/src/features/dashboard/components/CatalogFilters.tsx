import { Globe, Sparkles } from "lucide-react";

export type PriceFilter = "all" | "free" | "paid";

interface CatalogFiltersProps {
    filterPrice: PriceFilter;
    onFilterPriceChange: (value: PriceFilter) => void;
    onlyRu: boolean;
    onOnlyRuChange: (value: boolean) => void;
    isAiGenerated: boolean;
    onAiGeneratedChange: (value: boolean) => void;
}

export function CatalogFilters({
    filterPrice,
    onFilterPriceChange,
    onlyRu,
    onOnlyRuChange,
    isAiGenerated,
    onAiGeneratedChange,
}: CatalogFiltersProps) {
    return (
        <div className="flex flex-wrap items-center gap-2 my-auto">
            {/* 1. Переключатель: Все / Бесплатные / Платные */}
            <div className="flex items-center bg-muted/60 p-0.5 rounded-xl border border-border/50 text-xs font-medium">
                <button
                    type="button"
                    onClick={() => onFilterPriceChange("all")}
                    className={`px-3 py-1 rounded-lg transition-all ${
                        filterPrice === "all"
                            ? "bg-background text-foreground shadow-xs font-semibold"
                            : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                    Все
                </button>
                <button
                    type="button"
                    onClick={() => onFilterPriceChange("free")}
                    className={`px-3 py-1 rounded-lg transition-all ${
                        filterPrice === "free"
                            ? "bg-background text-emerald-500 shadow-xs font-semibold"
                            : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                    Бесплатные
                </button>
                <button
                    type="button"
                    onClick={() => onFilterPriceChange("paid")}
                    className={`px-3 py-1 rounded-lg transition-all ${
                        filterPrice === "paid"
                            ? "bg-background text-foreground shadow-xs font-semibold"
                            : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                    Платные
                </button>
            </div>

            <div className="h-4 w-[1px] bg-border/60 hidden sm:block mx-0.5" />

            {/* 2. Чипса: На русском */}
            <button
                type="button"
                onClick={() => onOnlyRuChange(!onlyRu)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-medium border transition-all ${
                    onlyRu
                        ? "bg-purple-500/10 border-purple-500/40 text-purple-400"
                        : "bg-muted/30 border-border/50 text-muted-foreground hover:text-foreground hover:bg-muted/60"
                }`}
            >
                <Globe className="w-3.5 h-3.5" />
                <span>Только RU</span>
            </button>

            {/* 3. Чипса: ИИ / Сгенерировано */}
            <button
                type="button"
                onClick={() => onAiGeneratedChange(!isAiGenerated)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-medium border transition-all ${
                    isAiGenerated
                        ? "bg-amber-500/10 border-amber-500/40 text-amber-400"
                        : "bg-muted/30 border-border/50 text-muted-foreground hover:text-foreground hover:bg-muted/60"
                }`}
            >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Сгенерировано ИИ</span>
            </button>
        </div>
    );
}
