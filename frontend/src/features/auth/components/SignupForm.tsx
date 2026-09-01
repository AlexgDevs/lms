import { Controller, useForm, useWatch } from "react-hook-form"
import { Link } from "@tanstack/react-router"
import { zodResolver } from "@hookform/resolvers/zod"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2 } from "lucide-react";
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
    FieldDescription,
    FieldError,
    FieldGroup,
    FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { type SignupFormData, signupFormSchema } from "@/features/auth/schemas/auth"
import { ROUTES } from "@/routes"
import useAuth from "@/features/auth/api/useAuth";

export function SignupForm() {
    const { signUpMutation } = useAuth()
    const form = useForm<SignupFormData>({
        resolver: zodResolver(signupFormSchema),
        mode: "onBlur",
        criteriaMode: "all",
        defaultValues: {
            name: "",
            username: "",
            email: "",
            password: "",
            confirmPassword: "",
            acceptPrivacy: false,
            acceptTerms: false,
        },
    })

    const acceptPrivacy = useWatch({ control: form.control, name: "acceptPrivacy" })
    const acceptTerms = useWatch({ control: form.control, name: "acceptTerms" })

    const onSubmit = (data: SignupFormData) => {
        if (signUpMutation.isPending) return

        // exclude fields not sent to the backend
        const { confirmPassword: _confirmPassword, acceptPrivacy: _acceptPrivacy, acceptTerms: _acceptTerms, ...submitData } = data
        signUpMutation.mutate({ body: submitData })
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Создание аккаунта</CardTitle>
                <CardDescription>
                    Заполните данные ниже, чтобы создать аккаунт.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <FieldGroup>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                            <Controller
                                name="name"
                                control={form.control}
                                render={({ field, fieldState }) => (
                                    <Field data-invalid={fieldState.invalid}>
                                        <FieldLabel htmlFor={field.name}>Имя и фамилия</FieldLabel>
                                        <Input
                                            {...field}
                                            id={field.name}
                                            aria-invalid={fieldState.invalid}
                                            type="text"
                                            placeholder="Иван Иванов"
                                            required
                                        />
                                        {fieldState.invalid && (
                                            <FieldError errors={[fieldState.error]} />
                                        )}
                                    </Field>
                                )}
                            />
                            <Controller
                                name="username"
                                control={form.control}
                                render={({ field, fieldState }) => (
                                    <Field data-invalid={fieldState.invalid}>
                                        <FieldLabel htmlFor={field.name}>Имя пользователя</FieldLabel>
                                        <Input
                                            {...field}
                                            id={field.name}
                                            aria-invalid={fieldState.invalid}
                                            type="text"
                                            placeholder="ivan_2026"
                                            required
                                        />
                                        {fieldState.invalid && (
                                            <FieldError errors={[fieldState.error]} />
                                        )}
                                    </Field>
                                )}
                            />
                        </div>
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
                                        required
                                    />
                                    <FieldDescription>
                                        Используем для связи и уведомлений. Мы не передаём ваш email
                                        третьим лицам.
                                    </FieldDescription>
                                    {fieldState.invalid && (
                                        <FieldError errors={[fieldState.error]} />
                                    )}
                                </Field>
                            )}
                        />
                        <Controller
                            name="password"
                            control={form.control}
                            render={({ field, fieldState }) => (
                                <Field data-invalid={fieldState.invalid}>
                                    <FieldLabel htmlFor={field.name}>Пароль</FieldLabel>
                                    <Input
                                        {...field}
                                        id={field.name}
                                        aria-invalid={fieldState.invalid}
                                        type="password"
                                        required
                                    />
                                    <FieldDescription>
                                        Не менее 6 символов.
                                    </FieldDescription>
                                    {fieldState.invalid && (
                                        <FieldError errors={[fieldState.error]} />
                                    )}
                                </Field>
                            )}
                        />
                        <Controller
                            name="confirmPassword"
                            control={form.control}
                            render={({ field, fieldState }) => (
                                <Field data-invalid={fieldState.invalid}>
                                    <FieldLabel htmlFor={field.name}>Повторите пароль</FieldLabel>
                                    <Input
                                        {...field}
                                        id={field.name}
                                        aria-invalid={fieldState.invalid}
                                        type="password"
                                        required
                                    />
                                    <FieldDescription>
                                        Повторите пароль для подтверждения.
                                    </FieldDescription>
                                    {fieldState.invalid && (
                                        <FieldError errors={[fieldState.error]} />
                                    )}
                                </Field>
                            )}
                        />
                        <Field>
                            <div className="space-y-2.5">
                                <label className="flex items-start gap-2.5 text-xs text-muted-foreground cursor-pointer">
                                    <Controller
                                        name="acceptPrivacy"
                                        control={form.control}
                                        render={({ field }) => (
                                            <Checkbox
                                                checked={field.value}
                                                onCheckedChange={(v) => field.onChange(v === true)}
                                                className="mt-0.5"
                                            />
                                        )}
                                    />
                                    <span>
                                        Я принимаю{" "}
                                        <Link to={ROUTES.PRIVACY} className="text-primary underline-offset-2 hover:underline">
                                            Политику конфиденциальности
                                        </Link>{" "}
                                        и соглашаюсь на обработку персональных данных.
                                    </span>
                                </label>
                                <label className="flex items-start gap-2.5 text-xs text-muted-foreground cursor-pointer">
                                    <Controller
                                        name="acceptTerms"
                                        control={form.control}
                                        render={({ field }) => (
                                            <Checkbox
                                                checked={field.value}
                                                onCheckedChange={(v) => field.onChange(v === true)}
                                                className="mt-0.5"
                                            />
                                        )}
                                    />
                                    <span>
                                        Я принимаю{" "}
                                        <Link to={ROUTES.TERMS} className="text-primary underline-offset-2 hover:underline">
                                            Условия использования
                                        </Link>
                                        .
                                    </span>
                                </label>
                                {(form.formState.errors.acceptPrivacy || form.formState.errors.acceptTerms) && (
                                    <p className="text-xs text-destructive">
                                        Подтвердите согласие, чтобы продолжить.
                                    </p>
                                )}
                            </div>
                            <Button type="submit" disabled={signUpMutation.isPending || !acceptPrivacy || !acceptTerms}>
                                {signUpMutation.isPending
                                    ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    : "Создать аккаунт"
                                }
                            </Button>
                            <p className="text-[11px] text-muted-foreground text-center">
                                Регистрируясь, вы подтверждаете, что ознакомились с{" "}
                                <Link to={ROUTES.PRIVACY} className="underline-offset-2 hover:underline">Политикой</Link>{" "}
                                и{" "}
                                <Link to={ROUTES.TERMS} className="underline-offset-2 hover:underline">Условиями</Link>.
                            </p>
                            <FieldDescription className="px-6 text-center">
                                Уже есть аккаунт? <Link to={ROUTES.LOGIN}>Войти</Link>
                            </FieldDescription>
                        </Field>
                    </FieldGroup>
                </form>
            </CardContent>
        </Card>
    )
}