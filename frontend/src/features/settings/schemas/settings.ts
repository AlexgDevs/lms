import * as z from "zod"

const profileSettingsSchema = z.object({
    username: z
        .string()
        .min(3, "Минимум 3 символа")
        .max(128, "Максимум 128 символов"),
    email: z.email("Введите корректный email"),
})

type ProfileSettingsFormData = z.infer<typeof profileSettingsSchema>

export { profileSettingsSchema }
export type { ProfileSettingsFormData }
