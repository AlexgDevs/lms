import { Link } from "@tanstack/react-router"
import { useMutation } from "@tanstack/react-query"
import { Loader2, MailCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import useAuth from "@/features/auth/api/useAuth"
import { resendVerificationApiV1AuthResendVerificationPostMutation } from "@/client/@tanstack/react-query.gen"
import { showErrorToast, showSuccessToast } from "@/lib/toast"
import { getErrorMessage } from "@/lib/errors"
import { ROUTES } from "@/routes"

export function EmailVerificationBanner() {
    const { user } = useAuth()

    const resendMutation = useMutation({
        ...resendVerificationApiV1AuthResendVerificationPostMutation(),
        onSuccess: () => {
            showSuccessToast("Письмо со ссылкой отправлено на почту.")
        },
        onError: (err) => {
            showErrorToast(getErrorMessage(err) || "Не удалось отправить письмо")
        },
    })

    if (!user || user.is_verified !== false) return null

    const handleResend = () => resendMutation.mutate({ body: { email: user.email } })

    return (
        <div className="w-full mx-auto max-w-7xl px-4 pt-4 md:px-8">
            <div className="flex flex-col gap-4 rounded-xl border border-border bg-card px-4 py-3 shadow-[var(--shadow-card)] sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <MailCheck className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground">
                            Подтвердите вашу электронную почту
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                            Мы отправили ссылку на {user.email}. Подтвердите адрес, чтобы
                            открыть все возможности платформы.
                        </p>
                    </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleResend}
                        disabled={resendMutation.isPending}
                    >
                        {resendMutation.isPending ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                            <MailCheck className="h-3.5 w-3.5" />
                        )}
                        Отправить повторно
                    </Button>
                    <Button asChild size="sm">
                        <Link to={ROUTES.VERIFY_EMAIL}>Подтвердить почту</Link>
                    </Button>
                </div>
            </div>
        </div>
    )
}
