import * as z from "zod"

const loginFormSchema = z.object({
    username: z
        .string()
        .min(1, "Username is required"),
    password: z
        .string()
        .min(6, "Password is required")
})

const signupFormSchema = z
    .object({
        email: z.email(),
        username: z.string().min(1, { message: "Username is required" }),
        name: z.string().min(1, { message: "Full Name is required" }),
        password: z
            .string()
            .min(1, { message: "Password is required" })
            .min(6, { message: "Password must be at least 6 characters" }),
        confirmPassword: z
            .string()
            .min(1, { message: "Password confirmation is required" }),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "The passwords don't match",
        path: ["confirmPassword"],
    })

const forgotPasswordSchema = z.object({
    email: z.email("Enter a valid email"),
})

const resetPasswordSchema = z
    .object({
        password: z.string().min(6, "Password must be at least 6 characters"),
        confirmPassword: z.string().min(1, "Please confirm your password"),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords don't match",
        path: ["confirmPassword"],
    })

const changePasswordSchema = z
    .object({
        currentPassword: z.string().min(1, "Current password is required"),
        newPassword: z.string().min(6, "Password must be at least 6 characters"),
        confirmNewPassword: z.string().min(1, "Please confirm your password"),
    })
    .refine((data) => data.newPassword === data.confirmNewPassword, {
        message: "Passwords don't match",
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