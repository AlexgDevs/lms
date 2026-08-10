import { isApiError } from "@/api/errors";

type ErrorBody = { detail?: unknown; msg?: unknown };

function isErrorBody(value: unknown): value is ErrorBody {
    return typeof value === "object" && value !== null;
}

export function getErrorMessage(error: unknown): string {
    if (!isApiError(error)) {
        return error instanceof Error ? error.message : "Something went wrong.";
    }

    const detail = isErrorBody(error.body) ? error.body.detail : undefined;

    if (Array.isArray(detail)) {
        const firstError = detail[0];
        if (isErrorBody(firstError) && typeof firstError.msg === "string") {
            return firstError.msg;
        }
    }

    return typeof detail === "string" ? detail : error.message;
}
