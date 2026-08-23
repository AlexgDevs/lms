import { useState } from "react"
import { Link, useLocation } from "@tanstack/react-router"
import { Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { ROUTES } from "@/routes"

const NAV_ITEMS = [
    { to: ROUTES.DASHBOARD, label: "Моё обучение" },
    { to: ROUTES.TEACHING, label: "Преподавание" },
    { to: ROUTES.CATALOG, label: "Каталог" },
] as const

export function MobileNav() {
    const [open, setOpen] = useState(false)
    const location = useLocation()

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden rounded-full text-muted-foreground hover:text-foreground"
                    aria-label="Меню"
                >
                    <Menu className="w-5 h-5" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[280px] p-0 gap-0">
                <DialogHeader className="px-5 py-4 border-b border-border">
                    <DialogTitle className="flex items-center justify-between">
                        <Link
                            to="/"
                            onClick={() => setOpen(false)}
                            className="flex items-center gap-2 font-bold text-lg text-foreground"
                        >
                            <img src="/logo.png" alt="PLECTIX" className="h-7 w-auto" />
                        </Link>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setOpen(false)}
                            className="rounded-full"
                        >
                            <X className="w-4 h-4" />
                        </Button>
                    </DialogTitle>
                </DialogHeader>
                <nav className="flex flex-col p-3">
                    {NAV_ITEMS.map((item) => {
                        const isActive =
                            item.to === "/"
                                ? location.pathname === "/"
                                : location.pathname.startsWith(item.to)
                        return (
                            <Link
                                key={item.to}
                                to={item.to}
                                onClick={() => setOpen(false)}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                                    isActive
                                        ? "bg-primary/10 text-primary"
                                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                                }`}
                            >
                                {item.label}
                            </Link>
                        )
                    })}
                </nav>
            </DialogContent>
        </Dialog>
    )
}
