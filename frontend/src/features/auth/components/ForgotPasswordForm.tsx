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
    const [resetToken, setResetToken] = useState<string | null>(null)
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
            const result = await res.json()
            setResetToken(result.reset_token)
            showSuccessToast("Reset token received. Use it to set a new password.")
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
                    <CardTitle>Reset your password</CardTitle>
                    <CardDescription>
                        Enter your email and we&apos;ll send you a reset token
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {resetToken ? (
                        <div className="flex flex-col gap-4">
                            <div className="rounded-md bg-muted p-3 text-sm">
                                <p className="font-medium mb-1">Your reset token:</p>
                                <code className="break-all">{resetToken}</code>
                            </div>
                            <Button asChild variant="outline">
                                <Link to={ROUTES.RESET_PASSWORD} search={{ token: resetToken }}>
                                    Set new password
                                </Link>
                            </Button>
                        </div>
                    ) : (
                        <form onSubmit={form.handleSubmit(onSubmit)}>
                            <FieldGroup>
                                <Controller
                                    name="email"
                                    control={form.control}
                                    render={({ field, fieldState }) => (
                                        <Field data-invalid={fieldState.invalid}>
                                            <FieldLabel htmlFor={field.name}>Email</FieldLabel>
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
                                        Send reset token
                                    </Button>
                                </Field>
                            </FieldGroup>
                        </form>
                    )}
                </CardContent>
            </Card>
            <p className="text-center text-sm text-muted-foreground">
                <Link to={ROUTES.LOGIN} className="underline underline-offset-4">
                    Back to login
                </Link>
            </p>
        </div>
    )
}
