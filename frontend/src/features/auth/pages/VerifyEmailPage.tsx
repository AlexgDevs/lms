import { useEffect, useState } from "react"
import { useNavigate, useSearch } from "@tanstack/react-router"
import { useMutation } from "@tanstack/react-query"
import { CheckCircle2, Loader2, Mail, MailWarning } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    Field,
    FieldGroup,
    FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
    resendVerificationApiV1AuthResendVerificationPostMutation,
    verifyEmailApiV1AuthVerifyEmailPostMutation,
} from "@/client/@tanstack/react-query.gen"
import { getErrorMessage } from "@/lib/errors"
import { showErrorToast, showSuccessToast } from "@/lib/toast"
import { ROUTES } from "@/routes"

type VerifyState = "idle" | "loading" | "success" | "error"

export function VerifyEmailPage() {
    const navigate = useNavigate()
    const { token } = useSearch({ from: "/verify-email" })
    const [state, setState] = useState<VerifyState>(() =>
        token ? "loading" : "error"
    )
    const [email, setEmail] = useState("")

    const { mutate: verifyEmail } = useMutation({
        ...verifyEmailApiV1AuthVerifyEmailPostMutation(),
        onSuccess: () => {
            setState("success")
            showSuccessToast("Почта подтверждена. Теперь вы можете войти.")
        },
        onError: (err) => {
            setState("error")
            showErrorToast(getErrorMessage(err) || "Не удалось подтвердить почту")
        },
    })

    const resendMutation = useMutation({
        ...resendVerificationApiV1AuthResendVerificationPostMutation(),
        onSuccess: () => {
            showSuccessToast("Письмо со ссылкой отправлено на почту.")
        },
        onError: (err) => {
            showErrorToast(getErrorMessage(err) || "Не удалось отправить письмо")
        },
    })

    useEffect(() => {
        if (!token) return
        verifyEmail({ body: { token } })
    }, [token, verifyEmail])

    const handleResend = () => {
        if (!email.trim()) return
        resendMutation.mutate({ body: { email: email.trim() } })
    }

    return (
        <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
            <div className="w-full max-w-sm">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-primary" />
                            Подтверждение почты
                        </CardTitle>
                        <CardDescription>
                            {state === "success"
                                ? "Ваш адрес электронной почты подтверждён."
                                : "Проверяем ссылку из письма..."}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {state === "loading" && (
                            <div className="flex flex-col items-center justify-center py-6 gap-2">
                                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                <p className="text-xs text-muted-foreground">Подтверждаем...</p>
                            </div>
                        )}

                        {state === "success" && (
                            <div className="flex flex-col items-center gap-3 py-4">
                                <CheckCircle2 className="h-10 w-10 text-success" />
                                <p className="text-sm text-foreground text-center">
                                    Почта подтверждена. Войдите, чтобы продолжить.
                                </p>
                                <Button onClick={() => navigate({ to: ROUTES.LOGIN })}>
                                    Перейти ко входу
                                </Button>
                            </div>
                        )}

                        {state === "error" && (
                            <div className="space-y-4">
                                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                                    <MailWarning className="h-4 w-4 shrink-0 text-destructive" />
                                    <p>
                                        Ссылка недействительна или устарела. Укажите почту, чтобы
                                        отправить новую ссылку.
                                    </p>
                                </div>
                                <FieldGroup>
                                    <Field>
                                        <FieldLabel>Электронная почта</FieldLabel>
                                        <Input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="you@example.com"
                                        />
                                    </Field>
                                    <Button
                                        type="button"
                                        className="w-full"
                                        onClick={handleResend}
                                        disabled={!email.trim() || resendMutation.isPending}
                                    >
                                        {resendMutation.isPending ? (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        ) : (
                                            <Mail className="mr-2 h-4 w-4" />
                                        )}
                                        Отправить новую ссылку
                                    </Button>
                                </FieldGroup>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
