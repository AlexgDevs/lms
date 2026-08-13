import { toast } from "sonner";

export function showSuccessToast(description: string): void {
    toast.success("Success", {
        description,
    });
}

export function showErrorToast(description: string): void {
    toast.error("Something went wrong", {
        description,
    });
}

export function showInfoToast(description: string): void {
    toast.info("Info", {
        description,
    });
}
