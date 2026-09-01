import { createFileRoute } from "@tanstack/react-router";
import { CatalogPage } from "@/features/dashboard/pages/CatalogPage";

export const Route = createFileRoute("/_layout/catalog")({
  validateSearch: (
    search: Record<string, unknown>
  ): {
    category?: string;
    q?: string;
    sort?: "popular" | "newest" | "rating";
    minRating?: number;
    price?: "all" | "free" | "paid";
    cert?: boolean;
  } => {
    const num = Number(search.minRating);
    return {
      category: typeof search.category === "string" ? search.category : undefined,
      q: typeof search.q === "string" ? search.q : undefined,
      sort:
        search.sort === "newest" || search.sort === "rating" ? search.sort : undefined,
      minRating: Number.isFinite(num) ? num : undefined,
      price:
        search.price === "free" || search.price === "paid" ? search.price : undefined,
      cert:
        search.cert === true || search.cert === "true" || search.cert === "1"
          ? true
          : undefined,
    };
  },
  component: CatalogPage,
  head: () => ({
    meta: [
      { title: "Каталог курсов — PLECTIX LMS" },
      { name: "description", content: "Найдите интересующий вас курс в каталоге PLECTIX. Бесплатные и платные курсы по программированию, дизайну и другим предметам." },
      { property: "og:title", content: "Каталог курсов — PLECTIX LMS" },
      { property: "og:description", content: "Найдите интересующий вас курс в каталоге PLECTIX." },
    ],
  }),
});
