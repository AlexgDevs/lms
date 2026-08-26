import { toast } from "sonner";

export function showSuccessToast(description: string): void {
    toast.success("Успешно", {
        description,
    });
}

export function showErrorToast(description: string): void {
    toast.error("Ошибка", {
        description,
    });
}

export function showInfoToast(description: string): void {
    toast.info("Информация", {
        description,
    });
}

export function showWarningToast(description: string): void {
    toast.warning("Внимание", {
        description,
    });
}

export function showToast(title: string, description?: string): void {
    toast(title, {
        description,
    });
}

export interface LoadingToastMessages {
    loading: string;
    success: string;
    error: string;
}

export async function withLoadingToast<T>(
    promise: Promise<T>,
    messages: LoadingToastMessages,
): Promise<T> {
    const id = toast.loading(messages.loading);
    try {
        const result = await promise;
        toast.success(messages.success, { id });
        return result;
    } catch (error) {
        toast.error(messages.error, { id });
        throw error;
    }
}
