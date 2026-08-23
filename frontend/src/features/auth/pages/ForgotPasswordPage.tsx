import { ForgotPasswordForm } from "@/features/auth/components/ForgotPasswordForm"

export function ForgotPasswordPage() {
    return (
        <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
            <div className="w-full max-w-xs">
                <ForgotPasswordForm />
            </div>
        </div>
    )
}
