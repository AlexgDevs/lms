export const ROUTES = {
    DASHBOARD: "/",
    LOGIN: "/login",
    SIGNUP: "/signup",
    FORGOT_PASSWORD: "/forgot-password",
    RESET_PASSWORD: "/reset-password",
    VERIFY_EMAIL: "/verify-email",
    PROFILE: "/profile",
    USER_PROFILE: "/users/$userId",
    PAYMENTS: "/profile/payments",
    SETTINGS: "/settings",
    TEACHING: "/teaching",
    TEACHING_GUIDE: "/teaching/guide",
    FOUNDERS: "/join/a8f92b3c1d",
    TEACHING_COURSE: "/teaching/courses",
    PRIVACY: "/privacy",
    TERMS: "/terms",
    COURSE_DETAIL: "/courses",
    LEARN: "/learn",
    CATALOG: "/catalog",
    ADMIN_MODERATION: "/admin/moderation"
} as const

/**
 * Пути, которые рендерятся без общего контейнера Layout (`max-w-7xl px-4 py-6`):
 * конструктор курсов — «Clean Editor», экран студента — «Clean Reader»,
 * гайд по созданию курсов — блочный full-interactive лендинг;
 * все управляют собственными отступами и единым полотном.
 */
export function isFullBleedPath(pathname: string): boolean {
    return (
        /^\/teaching\/courses\/[^/]+\/?$/.test(pathname) ||
        /^\/learn(\/|$)/.test(pathname) ||
        /^\/teaching\/guide\/?$/.test(pathname)
    )
}