import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { ThemeProvider } from "./theme";
import { LayoutProvider } from "./layout";

const queryClient = new QueryClient();

export function AppProviders({ children }: { children: React.ReactNode }) {
    return (
        <QueryClientProvider client={queryClient}>
            <ThemeProvider>
                <LayoutProvider>{children}</LayoutProvider>
            </ThemeProvider>
        </QueryClientProvider>
    );
}
