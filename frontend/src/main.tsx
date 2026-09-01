import "@/api/client.ts";
import "@/styles/global.css"
import { createRouter, RouterProvider } from "@tanstack/react-router"
import { StrictMode } from "react"
import ReactDOM from "react-dom/client"

import { routeTree } from "./routeTree.gen"
import { AppProviders } from "@/app/providers/AppProviders"
import { Toaster } from "@/components/ui/sonner"

const router = createRouter({ routeTree })
declare module "@tanstack/react-router" {
    interface Register {
        router: typeof router
    }
}

ReactDOM.createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <AppProviders>
            <RouterProvider router={router} />
            <Toaster gap={8} position="top-center" />
        </AppProviders>
    </StrictMode>,
)