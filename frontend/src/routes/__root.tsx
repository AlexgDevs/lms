import { createRootRoute, HeadContent, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { LayoutProvider } from "@/context/LayoutContext.tsx";
import { ThemeProvider } from "@/providers/ThemeProvider"; // Замени путь на актуальный, где лежит ThemeProvider
import "@/styles/global.css";

export const Route = createRootRoute({
  component: () => (
    <ThemeProvider>
      <LayoutProvider>
        <HeadContent />
        <Outlet />
        <ReactQueryDevtools initialIsOpen={false} />
        <TanStackRouterDevtools position="bottom-right" />
      </LayoutProvider>
    </ThemeProvider>
  ),
});