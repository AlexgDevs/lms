import * as z from "zod"

const loginFormSchema = z.object({
    username: z
        .string()
        .min(1, "Имя пользователя обязательно"),
    password: z
        .string()
        .min(1, "Пароль обязателен"),
})

const signupFormSchema = z
    .object({
        email: z.email("Введите корректный адрес электронной почты"),
        username: z.string().min(1, { message: "Имя пользователя обязательно" }),
        name: z.string().min(1, { message: "Имя и фамилия обязательны" }),
        password: z
            .string()
            .min(1, { message: "Пароль обязателен" })
            .min(6, { message: "Пароль должен быть не короче 6 символов" }),
        confirmPassword: z
            .string()
            .min(1, { message: "Подтверждение пароля обязательно" }),
        acceptPrivacy: z.boolean().refine((v) => v, {
            message: "Необходимо принять Политику конфиденциальности",
        }),
        acceptTerms: z.boolean().refine((v) => v, {
            message: "Необходимо принять Условия использования",
        }),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Пароли не совпадают",
        path: ["confirmPassword"],
    })

const forgotPasswordSchema = z.object({
    email: z.email("Введите корректный адрес электронной почты"),
})

const resetPasswordSchema = z
    .object({
        password: z.string().min(6, "Пароль должен быть не короче 6 символов"),
        confirmPassword: z.string().min(1, "Подтвердите пароль"),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Пароли не совпадают",
        path: ["confirmPassword"],
    })

const changePasswordSchema = z
    .object({
        currentPassword: z.string().min(1, "Введите текущий пароль"),
        newPassword: z.string().min(6, "Пароль должен быть не короче 6 символов"),
        confirmNewPassword: z.string().min(1, "Подтвердите новый пароль"),
    })
    .refine((data) => data.newPassword === data.confirmNewPassword, {
        message: "Пароли не совпадают",
        path: ["confirmNewPassword"],
    })

type SignupFormData = z.infer<typeof signupFormSchema>
type LoginFormData = z.infer<typeof loginFormSchema>
type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>
type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>
type ChangePasswordFormData = z.infer<typeof changePasswordSchema>

export {
    loginFormSchema,
    signupFormSchema,
    forgotPasswordSchema,
    resetPasswordSchema,
    changePasswordSchema,
}
export type {
    LoginFormData,
    SignupFormData,
    ForgotPasswordFormData,
    ResetPasswordFormData,
    ChangePasswordFormData,
}