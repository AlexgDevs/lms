import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import { getErrorMessage } from "@/utils"
import useCustomToast from "@/hooks/useCustomToast.tsx"
import { ROUTES } from "@/routes.ts"
import {
    loginUserAuthLoginPostMutation,
    registerUserAuthRegisterPostMutation,
    // getMeUsersMeGetOptions, // или твоя функция получения текущего юзера
} from "@/client/@tanstack/react-query.gen.ts"

const isLoggedIn = () => {
    return localStorage.getItem("access_token") !== null
}

const useAuth = () => {
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const { showErrorToast, showSuccessToast } = useCustomToast()

    // 1. Получаем текущего пользователя
    // const { data: user } = useQuery({
    //     ...getMeUsersMeGetOptions(),
    //     enabled: isLoggedIn(),
    // })

    // 2. Регистрация
    const signUpMutation = useMutation({
        ...registerUserAuthRegisterPostMutation(),
        onSuccess: () => {
            navigate({ to: ROUTES.LOGIN })
            showSuccessToast("Вы успешно зарегистрировались.")
        },
        onError: (error) => showErrorToast(getErrorMessage(error)),
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["users"] })
        },
    })

    // 3. Логин
    const loginMutation = useMutation({
        ...loginUserAuthLoginPostMutation(),
        onSuccess: (data) => {
            // Записываем access_token, который возвращает FastAPI
            if (data?.access_token) {
                localStorage.setItem("access_token", data.access_token)
            }
            // Инвалидируем кэш юзера, чтобы useQuery заново запросил профиль
            // queryClient.invalidateQueries({ queryKey: getMeUsersMeGetOptions().queryKey })
            
            navigate({ to: ROUTES.DASHBOARD })
            showSuccessToast("Вы успешно вошли в систему.")
        },
        onError: (error) => showErrorToast(getErrorMessage(error)),
    })

    // 4. Логаут
    const logout = () => {
        localStorage.removeItem("access_token")
        // Очищаем кэш TanStack Query при выходе
        queryClient.clear()
        navigate({ to: ROUTES.LOGIN })
    }

    return {
        signUpMutation,
        loginMutation,
        logout,
        // user,
    }
}

export { isLoggedIn }
export default useAuth
