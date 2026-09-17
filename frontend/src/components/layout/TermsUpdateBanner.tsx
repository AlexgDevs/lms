import { useState } from "react"
import { Link } from "@tanstack/react-router"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ROUTES } from "@/routes"
import useAuth from "@/features/auth/api/useAuth"

const STORAGE_KEY = "plectix_terms_ack_2026-09-17"

export function TermsUpdateBanner() {
  const { isLoggedIn } = useAuth()
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === "1"
    } catch {
      return false
    }
  })

  const dismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "1")
    } catch {
      // ignore quota errors
    }
    setDismissed(true)
  }

  if (!isLoggedIn || dismissed) return null

  return (
    <div
      role="region"
      aria-label="Обновление лицензионного соглашения"
      className="fixed bottom-4 left-4 z-50 max-w-[360px] w-[calc(100vw-2rem)] sm:w-[360px] rounded-xl border border-border bg-card p-4 shadow-lg"
    >
      <button
        type="button"
        onClick={dismiss}
        aria-label="Закрыть уведомление"
        className="absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
      >
        <X className="h-4 w-4" />
      </button>

      <p className="pr-6 text-sm leading-relaxed text-foreground">
        Мы обновили Лицензионное соглашение платформы PLECTIX. Ознакомиться с новой редакцией
        можно{" "}
        <Link
          to={ROUTES.TERMS}
          onClick={dismiss}
          className="font-medium text-primary underline underline-offset-2 hover:text-primary/80"
        >
          по ссылке
        </Link>
        . Продолжая пользоваться платформой, вы принимаете новые условия.
      </p>

      <div className="mt-3 flex justify-end">
        <Button size="sm" onClick={dismiss} className="h-8 rounded-full px-4">
          Понятно
        </Button>
      </div>
    </div>
  )
}
