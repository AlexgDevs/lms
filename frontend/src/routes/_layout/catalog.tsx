import { createFileRoute } from "@tanstack/react-router";
import { CatalogPage } from "@/features/dashboard/pages/CatalogPage";

export const Route = createFileRoute("/_layout/catalog")({
  component: CatalogPage,
});
