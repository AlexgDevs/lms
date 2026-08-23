import { Controller, useForm } from "react-hook-form"
import { useNavigate, useSearch } from "@tanstack/react-router"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, Lock } from "lucide-react"
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
    resetPasswordSchema,
    type ResetPasswordFormData,
} from "@/features/auth/schemas/auth"
import { ROUTES } from "@/routes"
import { getErrorMessage } from "@/lib/errors"
import { showErrorToast, showSuccessToast } from "@/lib/toast"

export function ResetPasswordForm() {
    const navigate = useNavigate()
    const { token } = useSearch({ from: "/reset-password" })
    const [isPending, setIsPending] = useState(false)

    const form = useForm<ResetPasswordFormData>({
        resolver: zodResolver(resetPasswordSchema),
        mode: "onBlur",
        defaultValues: { password: "", confirmPassword: "" },
    })

    const onSubmit = async (data: ResetPasswordFormData) => {
        if (isPending) return
        setIsPending(true)
        try {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL ?? ""}/api/v1/auth/reset-password`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ token, new_password: data.password }),
                }
            )
            if (!res.ok) throw new Error("Reset failed")
            showSuccessToast("Password has been reset. You can now log in.")
            navigate({ to: ROUTES.LOGIN })
        } catch (error) {
            showErrorToast(getErrorMessage(error))
        } finally {
            setIsPending(false)
        }
    }

    return (
        <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
            <div className="w-full max-w-xs">
                <div className="flex flex-col gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Set new password</CardTitle>
                            <CardDescription>
                                Enter your new password below
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={form.handleSubmit(onSubmit)}>
                                <FieldGroup>
                                    <Controller
                                        name="password"
                                        control={form.control}
                                        render={({ field, fieldState }) => (
                                            <Field data-invalid={fieldState.invalid}>
                                                <FieldLabel htmlFor={field.name}>
                                                    New password
                                                </FieldLabel>
                                                <Input
                                                    {...field}
                                                    id={field.name}
                                                    aria-invalid={fieldState.invalid}
                                                    type="password"
                                                />
                                                {fieldState.invalid && (
                                                    <FieldError
                                                        errors={
                                                            fieldState.error ? [fieldState.error] : []
                                                        }
                                                    />
                                                )}
                                            </Field>
                                        )}
                                    />
                                    <Controller
                                        name="confirmPassword"
                                        control={form.control}
                                        render={({ field, fieldState }) => (
                                            <Field data-invalid={fieldState.invalid}>
                                                <FieldLabel htmlFor={field.name}>
                                                    Confirm password
                                                </FieldLabel>
                                                <Input
                                                    {...field}
                                                    id={field.name}
                                                    aria-invalid={fieldState.invalid}
                                                    type="password"
                                                />
                                                {fieldState.invalid && (
                                                    <FieldError
                                                        errors={
                                                            fieldState.error ? [fieldState.error] : []
                                                        }
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
                                                <Lock className="mr-2 h-4 w-4" />
                                            )}
                                            Reset password
                                        </Button>
                                    </Field>
                                </FieldGroup>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
