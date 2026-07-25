import "@/api/client.ts";
import "@/styles/global.css"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRouter, RouterProvider } from "@tanstack/react-router"
import { StrictMode } from "react"
import ReactDOM from "react-dom/client"

import { routeTree } from "./routeTree.gen"
import { Toaster } from "@/components/ui/sonner"

const queryClient = new QueryClient();

const router = createRouter({ routeTree })
declare module "@tanstack/react-router" {
    interface Register {
        router: typeof router
    }
}

ReactDOM.createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <QueryClientProvider client={queryClient}>
                <RouterProvider router={router} />
                <Toaster gap={8} position="top-center" />
        </QueryClientProvider>
    </StrictMode>,
)