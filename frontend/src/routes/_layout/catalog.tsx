import { createFileRoute } from "@tanstack/react-router";
import { CatalogPage } from "@/features/dashboard/pages/CatalogPage";

export const Route = createFileRoute("/_layout/catalog")({
  validateSearch: (search: Record<string, unknown>): { category?: string } => ({
    category: typeof search.category === "string" ? search.category : undefined,
  }),
  component: CatalogPage,
});
