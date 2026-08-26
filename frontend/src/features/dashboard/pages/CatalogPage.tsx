import { useEffect, useState } from "react";
import { Loader2, SlidersHorizontal } from "lucide-react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { useCourseCatalog } from "@/features/dashboard/api/useCourses";
import { useCategoryBySlug } from "@/features/dashboard/api/useCategories";
import { CourseCard } from "@/features/dashboard/components/CourseCard";
import {
  CatalogFiltersPanel,
  type CatalogPrice,
  type CatalogSort,
} from "@/features/dashboard/components/CatalogFiltersPanel";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import type { CourseCardData } from "@/features/dashboard/types";

const PAGE_SIZE = 12;

export function CatalogPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/_layout/catalog" });
  const categorySlug = search.category;
  const query = search.q;
  const activeCategory = useCategoryBySlug(categorySlug);

  const sort = (search.sort ?? "popular") as CatalogSort;
  const minRating = search.minRating ?? 0;
  const price = (search.price ?? "all") as CatalogPrice;
  const certificateOnly = search.cert ?? false;

  const [filtersOpen, setFiltersOpen] = useState(false);

  const { data, isLoading, isFetchingNextPage, fetchNextPage, hasNextPage } =
    useCourseCatalog(PAGE_SIZE, categorySlug, query, certificateOnly, sort, minRating, price);

  const courses = (data?.pages.flat() ?? []) as CourseCardData[];

  const updateSearch = (patch: Record<string, unknown>) => {
    navigate({
      to: "/catalog",
      search: { ...search, ...patch },
      replace: true,
    });
  };

  useEffect(() => {
    const sentinel = document.getElementById("catalog-sentinel");
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: "300px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleReset = () => {
    navigate({
      to: "/catalog",
      search: {},
      replace: true,
    });
  };

  const filters = (
    <CatalogFiltersPanel
      sort={sort}
      onSortChange={(value) => updateSearch({ sort: value })}
      category={categorySlug}
      onCategoryChange={(value) => updateSearch({ category: value })}
      price={price}
      onPriceChange={(value) => updateSearch({ price: value })}
      minRating={minRating}
      onMinRatingChange={(value) => updateSearch({ minRating: value || undefined })}
      certificateOnly={certificateOnly}
      onCertificateOnlyChange={(value) => updateSearch({ cert: value })}
      onReset={handleReset}
    />
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6 py-2 px-4 sm:px-6">
      <div className="pb-2">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {activeCategory
            ? activeCategory.name
            : query
              ? "Поиск курсов"
              : "Каталог курсов"}
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          {activeCategory
            ? query
              ? `Результаты по запросу «${query}» в категории «${activeCategory.name}»`
              : "Курсы выбранной категории"
            : query
              ? `Результаты по запросу «${query}»`
              : "Все опубликованные курсы платформы"}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        {/* Асид — десктоп */}
        <aside className="hidden lg:block">
          <div className="sticky top-20">{filters}</div>
        </aside>

        {/* Основной столбец */}
        <div className="min-w-0">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs text-muted-foreground">
              Найдено: <span className="font-semibold text-foreground">{courses.length}</span>
            </p>
            <Button
              variant="outline"
              size="sm"
              className="lg:hidden"
              onClick={() => setFiltersOpen(true)}
            >
              <SlidersHorizontal className="h-4 w-4" />
              Фильтры
            </Button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : courses.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground text-sm">
              По заданным фильтрам ничего не найдено.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {courses.map((course) => (
                <CourseCard key={course.id} course={course} alwaysOpenDetail />
              ))}
            </div>
          )}

          <div id="catalog-sentinel" className="h-10" />
          {isFetchingNextPage && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            </div>
          )}
          {!hasNextPage && !isLoading && courses.length > 0 && (
            <p className="text-center text-xs text-muted-foreground py-2">Конец списка</p>
          )}
        </div>
      </div>

      {/* Мобильная шторка фильтров */}
      <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-xl">
          <SheetHeader>
            <SheetTitle>Фильтры</SheetTitle>
          </SheetHeader>
          <div className="px-4 pb-4">{filters}</div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
