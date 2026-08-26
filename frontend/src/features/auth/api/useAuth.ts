import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import { getErrorMessage } from "@/lib/errors";
import { showErrorToast, showSuccessToast } from "@/lib/toast";
import { ROUTES } from "@/routes.ts";
import {
    loginApiV1AuthLoginPostMutation,
    registerApiV1AuthRegisterPostMutation,
    getCurrentUserApiV1UsersMeGetOptions,
} from "@/client/@tanstack/react-query.gen.ts";

const isLoggedIn = () => {
    return localStorage.getItem("access_token") !== null
}

const useAuth = () => {
    const navigate = useNavigate()
    const queryClient = useQueryClient()

    const { data: user } = useQuery({
        ...getCurrentUserApiV1UsersMeGetOptions(),
        enabled: isLoggedIn(),
    })

    const signUpMutation = useMutation({
        ...registerApiV1AuthRegisterPostMutation(),
        onSuccess: () => {
            navigate({ to: ROUTES.LOGIN })
            showSuccessToast("Вы успешно зарегистрировались.")
        },
        onError: (error) => showErrorToast(getErrorMessage(error)),
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["users"] })
        },
    })

    const loginMutation = useMutation({
        ...loginApiV1AuthLoginPostMutation(),
        onSuccess: (data) => {
            localStorage.setItem("access_token", data.access_token)
            localStorage.setItem("refresh_token", data.refresh_token);
            navigate({ to: ROUTES.DASHBOARD })
            showSuccessToast("Вы успешно вошли в систему.")
        },
        onError: (error) => showErrorToast(getErrorMessage(error)),
    })

    const logout = () => {
        localStorage.removeItem("access_token")
        localStorage.removeItem("refresh_token");
        navigate({ to: ROUTES.LOGIN })
    }

    return {
        signUpMutation,
        loginMutation,
        logout,
        user,
        isLoggedIn: isLoggedIn(),
    }
}

export { isLoggedIn }
export default useAuth