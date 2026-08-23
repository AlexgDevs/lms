import { createFileRoute } from "@tanstack/react-router";
import { CatalogPage } from "@/features/dashboard/pages/CatalogPage";

export const Route = createFileRoute("/_layout/catalog")({
  validateSearch: (
    search: Record<string, unknown>
  ): { category?: string; q?: string } => ({
    category: typeof search.category === "string" ? search.category : undefined,
    q: typeof search.q === "string" ? search.q : undefined,
  }),
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
