import { Controller, useForm } from "react-hook-form"
import { Link } from "@tanstack/react-router"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, Mail } from "lucide-react"
import { useState } from "react"
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
    FieldError,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
    forgotPasswordSchema,
    type ForgotPasswordFormData,
} from "@/features/auth/schemas/auth"
import { ROUTES } from "@/routes"
import { getErrorMessage } from "@/lib/errors"
import { showErrorToast, showSuccessToast } from "@/lib/toast"

export function ForgotPasswordForm() {
    const [isSent, setIsSent] = useState(false)
    const [isPending, setIsPending] = useState(false)

    const form = useForm<ForgotPasswordFormData>({
        resolver: zodResolver(forgotPasswordSchema),
        mode: "onBlur",
        defaultValues: { email: "" },
    })

    const onSubmit = async (data: ForgotPasswordFormData) => {
        if (isPending) return
        setIsPending(true)
        try {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL ?? ""}/api/v1/auth/forgot-password`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email: data.email }),
                }
            )
            if (!res.ok) throw new Error("Request failed")
            setIsSent(true)
            showSuccessToast("Ссылка для сброса пароля отправлена на почту.")
        } catch (error) {
            showErrorToast(getErrorMessage(error))
        } finally {
            setIsPending(false)
        }
    }

    return (
        <div className="flex flex-col gap-6">
            <Card>
                <CardHeader>
                    <CardTitle>Сброс пароля</CardTitle>
                    <CardDescription>
                        Введите email — мы отправим вам код для сброса пароля
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isSent ? (
                        <div className="flex flex-col gap-3 rounded-md bg-muted/40 p-4 text-sm">
                            <p className="text-foreground font-medium">
                                Письмо отправлено
                            </p>
                            <p className="text-muted-foreground">
                                Перейдите по ссылке из письма, чтобы задать новый пароль.
                            </p>
                        </div>
                    ) : (
                        <form onSubmit={form.handleSubmit(onSubmit)}>
                            <FieldGroup>
                                <Controller
                                    name="email"
                                    control={form.control}
                                    render={({ field, fieldState }) => (
                                        <Field data-invalid={fieldState.invalid}>
                                            <FieldLabel htmlFor={field.name}>Электронная почта</FieldLabel>
                                            <Input
                                                {...field}
                                                id={field.name}
                                                aria-invalid={fieldState.invalid}
                                                type="email"
                                                placeholder="you@example.com"
                                            />
                                            {fieldState.invalid && (
                                                <FieldError
                                                    errors={fieldState.error ? [fieldState.error] : []}
                                                />
                                            )}
                                        </Field>
                                    )}
                                />
                                <Field>
                                    <Button type="submit" disabled={isPending}>
                                        {isPending ? (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        ) : (
                                            <Mail className="mr-2 h-4 w-4" />
                                        )}
                                        Отправить код
                                    </Button>                                </Field>
                            </FieldGroup>
                        </form>
                    )}
                </CardContent>
            </Card>
            <p className="text-center text-sm text-muted-foreground">
                <Link to={ROUTES.LOGIN} className="underline underline-offset-4">
                    Вернуться ко входу
                </Link>
            </p>
        </div>
    )
}
