import { Controller, useForm } from "react-hook-form"
import { Link } from "@tanstack/react-router"
import { zodResolver } from "@hookform/resolvers/zod"
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
import { loginFormSchema, type LoginFormData } from "@/features/auth/schemas/auth"
import { ROUTES } from "@/routes"
import useAuth from "@/features/auth/api/useAuth";

export function LoginForm() {
    const form = useForm<LoginFormData>({
        resolver: zodResolver(loginFormSchema),
        mode: "onBlur",
        criteriaMode: "all",
        defaultValues: {
            username: "",
            password: "",
        },
    })
    const { loginMutation } = useAuth()

    const onSubmit = (data: LoginFormData) => {
        if (loginMutation.isPending) return
        loginMutation.mutate({ body: data })
    }

    return (
        <div className="flex flex-col gap-6">
            <Card>
                <CardHeader>
                    <CardTitle>Вход в аккаунт</CardTitle>
                    <CardDescription>
                        Введите имя пользователя и пароль, чтобы войти в свою учётную запись.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={form.handleSubmit(onSubmit)}>
                        <FieldGroup>
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
                                            placeholder="Введите имя пользователя"
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
                                name="password"
                                control={form.control}
                                render={({ field, fieldState }) => (
                                    <Field data-invalid={fieldState.invalid}>
                                        <div className="flex items-center">
                                            <FieldLabel htmlFor={field.name}>Пароль</FieldLabel>
                                            <Link
                                                to={ROUTES.FORGOT_PASSWORD}
                                                className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                                            >
                                                Забыли пароль?
                                            </Link>
                                        </div>
                                        <Input
                                            {...field}
                                            id={field.name}
                                            aria-invalid={fieldState.invalid}
                                            type="password"
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
                                <Button type="submit" disabled={loginMutation.isPending}>
                                    {loginMutation.isPending
                                        ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        : "Войти"
                                    }
                                </Button>
                                <p className="text-center text-[11px] text-muted-foreground">
                                    Регистрируясь, вы принимаете{" "}
                                    <Link to={ROUTES.PRIVACY} className="underline-offset-2 hover:underline">Политику конфиденциальности</Link>{" "}
                                    и{" "}
                                    <Link to={ROUTES.TERMS} className="underline-offset-2 hover:underline">Условия использования</Link>.
                                </p>
                                <FieldDescription className="text-center">
                                    Нет аккаунта?{" "}
                                    <Link to={ROUTES.SIGNUP}>Зарегистрироваться</Link>
                                </FieldDescription>
                            </Field>
                        </FieldGroup>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
