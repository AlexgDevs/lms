import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { KeyRound, Loader2 } from "lucide-react"
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
    changePasswordSchema,
    type ChangePasswordFormData,
} from "@/features/auth/schemas/auth"
import { getErrorMessage } from "@/lib/errors"
import { showErrorToast, showSuccessToast } from "@/lib/toast"

export function PasswordChangePanel() {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const form = useForm<ChangePasswordFormData>({
        resolver: zodResolver(changePasswordSchema),
        mode: "onBlur",
        defaultValues: {
            currentPassword: "",
            newPassword: "",
            confirmNewPassword: "",
        },
    })

    const onSubmit = async (data: ChangePasswordFormData) => {
        if (isSubmitting) return
        setIsSubmitting(true)
        try {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL ?? ""}/api/v1/users/me/password`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${localStorage.getItem("access_token")}`,
                    },
                    body: JSON.stringify({
                        current_password: data.currentPassword,
                        new_password: data.newPassword,
                    }),
                }
            )
            if (!res.ok) {
                const err = await res.json().catch(() => ({}))
                throw new Error(err.detail || "Failed to change password")
            }
            showSuccessToast("Пароль успешно изменён")
            form.reset()
        } catch (error) {
            showErrorToast(getErrorMessage(error))
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <KeyRound className="w-4 h-4" />
                    Смена пароля
                </CardTitle>
                <CardDescription>
                    Введите текущий пароль и новый пароль для обновления.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <FieldGroup>
                        <Controller
                            name="currentPassword"
                            control={form.control}
                            render={({ field, fieldState }) => (
                                <Field data-invalid={fieldState.invalid}>
                                    <FieldLabel htmlFor={field.name}>
                                        Текущий пароль
                                    </FieldLabel>
                                    <Input
                                        {...field}
                                        id={field.name}
                                        aria-invalid={fieldState.invalid}
                                        type="password"
                                        placeholder="••••••••"
                                    />
                                    {fieldState.invalid && (
                                        <FieldError
                                            errors={fieldState.error ? [fieldState.error] : []}
                                        />
                                    )}
                                </Field>
                            )}
                        />
                        <Controller
                            name="newPassword"
                            control={form.control}
                            render={({ field, fieldState }) => (
                                <Field data-invalid={fieldState.invalid}>
                                    <FieldLabel htmlFor={field.name}>
                                        Новый пароль
                                    </FieldLabel>
                                    <Input
                                        {...field}
                                        id={field.name}
                                        aria-invalid={fieldState.invalid}
                                        type="password"
                                        placeholder="Минимум 6 символов"
                                    />
                                    {fieldState.invalid && (
                                        <FieldError
                                            errors={fieldState.error ? [fieldState.error] : []}
                                        />
                                    )}
                                </Field>
                            )}
                        />
                        <Controller
                            name="confirmNewPassword"
                            control={form.control}
                            render={({ field, fieldState }) => (
                                <Field data-invalid={fieldState.invalid}>
                                    <FieldLabel htmlFor={field.name}>
                                        Повторите пароль
                                    </FieldLabel>
                                    <Input
                                        {...field}
                                        id={field.name}
                                        aria-invalid={fieldState.invalid}
                                        type="password"
                                        placeholder="••••••••"
                                    />
                                    {fieldState.invalid && (
                                        <FieldError
                                            errors={fieldState.error ? [fieldState.error] : []}
                                        />
                                    )}
                                </Field>
                            )}
                        />
                        <div className="flex items-center justify-end pt-2">
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                Сменить пароль
                            </Button>
                        </div>
                    </FieldGroup>
                </form>
            </CardContent>
        </Card>
    )
}
