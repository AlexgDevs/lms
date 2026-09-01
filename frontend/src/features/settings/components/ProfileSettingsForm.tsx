import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
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
    FieldError,
    FieldGroup,
    FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import useAuth from "@/features/auth/api/useAuth"
import { AvatarSettingsSection } from "@/features/settings/components/AvatarSettingsSection"
import { useUpdateProfile } from "@/features/settings/api/useSettings"
import {
    profileSettingsSchema,
    type ProfileSettingsFormData,
} from "@/features/settings/schemas/settings"

export function ProfileSettingsForm() {
    const { user } = useAuth()
    const updateProfile = useUpdateProfile()

    const form = useForm<ProfileSettingsFormData>({
        resolver: zodResolver(profileSettingsSchema),
        mode: "onBlur",
        defaultValues: {
            username: user?.username ?? "",
            email: user?.email ?? "",
        },
    })

    const onSubmit = (data: ProfileSettingsFormData) => {
        if (updateProfile.isPending) return
        updateProfile.mutate({ body: data })
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Профиль</CardTitle>
                <CardDescription>
                    Имя пользователя и почта отображаются в вашем профиле и на платформе.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <AvatarSettingsSection />
                <div className="h-px bg-border" />
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
                                        placeholder="Ваше имя пользователя"
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

                        <div className="flex items-center justify-end gap-3 pt-2">
                            <Button type="submit" disabled={updateProfile.isPending}>
                                {updateProfile.isPending && (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                Сохранить
                            </Button>
                        </div>
                    </FieldGroup>
                </form>
            </CardContent>
        </Card>
    )
}
