import { isApiError } from "@/api/errors";
import { MEDIA_MAX_SIZE_MB } from "@/lib/media";

type ErrorBody = { error?: unknown; detail?: unknown; msg?: unknown };

function isErrorBody(value: unknown): value is ErrorBody {
    return typeof value === "object" && value !== null;
}

const ERROR_MESSAGES: Record<string, string> = {
    // core
    ObjectNotFoundError: "Не найдено.",
    ObjectAlreadyExistsError: "Такой объект уже существует.",
    RateLimitExceededError: "Слишком много запросов. Попробуйте позже.",
    StorageError: "Ошибка хранилища файлов.",
    StorageObjectNotFoundError: "Файл не найден в хранилище.",

    // auth
    AuthorizationError: "Ошибка авторизации.",
    IncorrectPasswordError: "Неверный пароль.",
    InvalidCredentialsError: "Неверный логин или пароль.",
    InvalidAccessTokenError: "Сессия истекла. Войдите заново.",
    InvalidRefreshTokenError: "Сессия истекла. Войдите заново.",
    NoRefreshTokenError: "Сессия истекла. Войдите заново.",

    // user
    UserNotFoundError: "Пользователь не найден.",
    UserAlreadyExistsError: "Пользователь с таким email или именем уже существует.",
    UserNotStaffError: "Требуются права администратора.",
    UserNotVerifiedError: "Подтвердите email, чтобы продолжить.",
    UserNotActiveError: "Аккаунт деактивирован.",

    // course
    CourseNotFoundError: "Курс не найден.",
    CourseMemberNotFoundError: "Участник не найден.",
    CourseMemberAlredyEnrolledError: "Вы уже записаны на этот курс.",
    CourseOwnerCannotEnrollError: "Автор курса не может записаться на свой курс.",
    CourseNotPublishedError: "Курс ещё не опубликован.",
    CourseAlreadyPublishedError: "Курс уже опубликован.",
    CourseNotUnderReviewError: "Курс не находится на модерации.",
    CourseIncompleteError: "Курс не соответствует минимальным требованиям публикации.",
    CourseStatusNotAllowedError: "Статус курса можно изменить только через модерацию.",
    CourseGenerateError: "Не удалось сгенерировать курс.",
    CourseGenerateLimitError: "Достигнут лимит генерации курсов ИИ.",
    CoursePaymentRequiredError: "Этот курс требует оплаты перед записью.",
    CourseHasStudentsError: "Нельзя удалить курс: на нём есть студенты или успешные оплаты.",
    ContentHasStudentResultsError: "Нельзя удалить: уже есть прогресс или ответы учащихся. Можно только исправить содержимое.",

    // module / lesson / block
    ModuleNotFoundError: "Модуль не найден.",
    LessonNotFoundError: "Урок не найден.",
    LessonProgressNotFoundError: "Прогресс урока не найден.",
    BlockNotFoundError: "Блок не найден.",
    BlockTypeNotMediaError: "Загрузка медиа доступна только в медиа-блоке (изображение/видео/аудио/файл).",

    // media
    MediaNotFoundError: "Файл не найден.",
    MediaForbiddenError: "Нет доступа к этому файлу.",
    MediaTooLargeError: `Файл слишком большой. Максимум ${MEDIA_MAX_SIZE_MB} МБ.`,
    MediaTypeNotAllowedError: "Недопустимый тип файла.",
    MediaInUseError: "Файл используется другими объектами и не может быть удалён.",

    // certificate
    CourseNotCompletedError: "Курс не завершён.",
    CertificateNotEnabledError: "Для этого курса сертификаты отключены.",
    CertificateNotReadyError: "Сертификат ещё не готов.",
    CertificateUserNotFoundError: "Пользователь не найден.",
    CertificateCourseNotFoundError: "Курс не найден.",

    // review
    ReviewNotFoundError: "Отзыв не найден.",
    ReviewTargetNotFoundError: "Объект для отзыва не найден.",
    ReviewParentNotFoundError: "Родительский отзыв не найден.",
    ReviewAlreadyExistsError: "Вы уже оставляли отзыв на этот объект.",
    ReviewInvalidRatingError: "Оценка должна быть целым числом от 1 до 5.",
    ReviewNotAllowedError: "Недостаточно прав для этого действия.",
    ReviewReplyNotAllowedError:
        "Ответ не может содержать оценку и должен указывать на тот же объект, что и родительский отзыв.",

    // payment
    PaymentNotFoundError: "Платёж не найден.",
    PaymentRequiredError: "Этот курс требует оплаты перед записью.",
    CourseAlreadyPaidError: "Курс уже оплачен.",
    PaymentNotConfiguredError: "Платежи не настроены.",
    PaymentProviderError: "Ошибка платёжного сервиса.",
    PaymentVerificationError: "Не удалось подтвердить платёж.",

    // submissions
    InvalidSubmissionCountError: "Недопустимое количество ответов.",
    DuplicateBlocksInSubmissionError: "В отправке есть повторяющиеся блоки.",
    InvalidSubmissionBlocksError: "Недопустимые блоки в отправке.",

    // codeexec
    CodeExecUnavailableError: "Сервис выполнения кода временно недоступен, попробуйте позже.",
    CodeExecTimeoutError: "Превышено время выполнения кода, попробуйте ещё раз.",
    CodeExecValidationError: "Недопустимый запрос на выполнение кода.",
    CodeExecRunError: "Ошибка выполнения кода во время запуска.",

    // ai (shared)
    AiError: "Ошибка ИИ-сервиса.",
    AiNotConfiguredError: "ИИ не настроен (отсутствует API-ключ).",
    AiUnavailableError: "ИИ-сервис временно недоступен, попробуйте позже.",
    AiRateLimitError: "Превышен лимит запросов к ИИ, попробуйте позже.",
    AiResponseError: "ИИ вернул некорректный ответ.",

    // ai/tgp
    TgpNotEnabledError: "TGP не включён для этого курса.",
    TgpQuestionNotFoundError: "Вопрос TGP не найден.",
    TgpNoQuestionsError: "TGP-тест ещё не сгенерирован для этого курса.",
    TgpInvalidAnswersError: "Ответы не соответствуют сгенерированному TGP-тесту.",
    NotEnoughModulesError: "Для генерации TGP нужно минимум 5 модулей.",
    TgpCooldownError: "TGP недавно уже генерировался, попробуйте позже.",
    TgpGenerationInProgressError: "Генерация TGP уже идёт.",
    TgpAiNotConfiguredError: "ИИ не настроен (отсутствует API-ключ).",
    TgpAiUnavailableError: "ИИ-сервис временно недоступен, попробуйте позже.",
    TgpGeminiRateLimitError: "Превышен лимит запросов к ИИ, попробуйте позже.",
    TgpAiResponseError: "ИИ вернул некорректный ответ.",

    // ai/assistant
    AssistantError: "Ошибка ИИ-ассистента.",
    AssistantAiNotConfiguredError: "ИИ не настроен (отсутствует API-ключ).",
};

const DETAIL_TRANSLATIONS: Record<string, string> = {
    "User not found": "Пользователь не найден.",
    "Incorrect current password": "Неверный текущий пароль.",
    "Untrusted webhook IP": "Недоверенный IP-адрес вебхука.",
};

const NETWORK_ERROR_MESSAGE = "Ошибка сети. Проверьте соединение.";
const VALIDATION_ERROR_MESSAGE = "Проверьте правильность заполнения полей.";

type ValidationErrorItem = {
    loc?: unknown;
    msg?: unknown;
    type?: unknown;
};

const FIELD_LABELS: Record<string, string> = {
    title: "Название",
    description: "Описание",
    price: "Цена",
    category_id: "Категория",
    password: "Пароль",
    new_password: "Новый пароль",
    current_password: "Текущий пароль",
    username: "Имя пользователя",
    email: "Email",
    name: "Имя",
    reason: "Причина",
    topic: "Тема",
    block_type: "Тип блока",
    payload: "Содержимое блока",
    text: "Текст",
    html: "Текст",
    options: "Варианты ответа",
    correct_option_id: "Правильный вариант",
    correct_option_ids: "Правильные варианты",
    code: "Код",
    language: "Язык",
    test_cases: "Тестовые случаи",
    alt_text: "Alt-текст",
    url: "Ссылка",
    file_name: "Имя файла",
    ordered_ids: "Порядок элементов",
    token: "Токен",
    modules_count: "Количество модулей",
    lessons_per_module: "Уроков в модуле",
    blocks_per_lesson: "Блоков в уроке",
};

// Bound values stored in kopecks must be shown to the user in rubles.
const KOPECKS_FIELDS = new Set(["price"]);

function formatBound(field: string | undefined, value: number): string {
    if (field && KOPECKS_FIELDS.has(field)) {
        const rub = value / 100;
        return `${rub.toLocaleString("ru-RU")} ₽`;
    }
    return value.toLocaleString("ru-RU");
}

function translatePydanticMsg(
    msg: string,
    field: string | undefined,
): string {
    // "Value error, <русский текст>" — our own validators already speak Russian.
    if (msg.startsWith("Value error, ")) {
        return msg.slice("Value error, ".length);
    }

    let m = /^String should have at most (\d+) characters$/.exec(msg);
    if (m) {
        return `не длиннее ${m[1]} символов`;
    }
    m = /^String should have at least (\d+) characters$/.exec(msg);
    if (m) {
        return `не короче ${m[1]} символов`;
    }
    m = /^Input should be greater than or equal to (.+)$/.exec(msg);
    if (m) {
        const parsed = Number(m[1]);
        return `не меньше ${Number.isNaN(parsed) ? m[1] : formatBound(field, parsed)}`;
    }
    m = /^Input should be less than or equal to (.+)$/.exec(msg);
    if (m) {
        const parsed = Number(m[1]);
        return `не больше ${Number.isNaN(parsed) ? m[1] : formatBound(field, parsed)}`;
    }
    m = /^Input should be greater than (.+)$/.exec(msg);
    if (m) {
        const parsed = Number(m[1]);
        return `больше ${Number.isNaN(parsed) ? m[1] : formatBound(field, parsed)}`;
    }
    m = /^Input should be less than (.+)$/.exec(msg);
    if (m) {
        const parsed = Number(m[1]);
        return `меньше ${Number.isNaN(parsed) ? m[1] : formatBound(field, parsed)}`;
    }
    if (/^Input should be a valid (integer|float|number)$/.test(msg)) {
        return "должно быть числом";
    }
    if (msg === "Input should be a valid UUID") {
        return "некорректный идентификатор";
    }
    if (msg === "Field required") {
        return "обязательное поле";
    }
    if (msg === "Input should not be empty") {
        return "не должно быть пустым";
    }
    if (msg === "Input should be a valid string") {
        return "должно быть строкой";
    }
    if (msg === "Input should be a valid email address") {
        return "некорректный email";
    }
    if (msg.startsWith("Input should be")) {
        return "некорректное значение";
    }

    return msg;
}

function fieldLabelFromLoc(loc: unknown): string | undefined {
    if (!Array.isArray(loc)) return undefined;
    const segments = loc.filter(
        (s): s is string | number => typeof s === "string" || typeof s === "number",
    );
    // Drop trailing numeric indices (e.g. ["body", "payload", "options", 0, "text"])
    while (segments.length && typeof segments[segments.length - 1] === "number") {
        segments.pop();
    }
    const last = segments[segments.length - 1];
    if (typeof last !== "string") return undefined;
    return FIELD_LABELS[last] ?? last;
}

// Polymorphic payload errors are wrapped by the backend mixin into a single
// "Incorrect payload data for type '...': <ValidationError>" string.
const PAYLOAD_WRAPPER_RE =
    /Incorrect payload data for type '([^']+)':\s*\d+ validation errors? for \w+\s+([\s\S]*?)\s+\[type=/;

function describePayloadError(msg: string): string {
    const match = PAYLOAD_WRAPPER_RE.exec(msg);
    if (!match) {
        return "Содержимое блока заполнено неверно.";
    }
    const innerPath = match[2].trim().split("\n")[0].trim();
    const lastSegment = innerPath.replace(/\.\d+/g, "").split(".").pop() ?? "";
    const field = FIELD_LABELS[lastSegment] ?? lastSegment;

    const typeMatch = /\[type=([a-z_0-9]+)/.exec(msg);
    const innerType = typeMatch?.[1];
    const innerMsgMatch = new RegExp(
        `${innerPath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s+([^\\[]+)\\[type=`,
    ).exec(msg);
    const innerMsg = innerMsgMatch?.[1].trim() ?? "";

    let translated = "";
    if (innerType === "string_too_long") {
        const n = /at most (\d+)/.exec(innerMsg)?.[1];
        translated = n ? `не длиннее ${n} символов` : "слишком длинное значение";
    } else if (innerType === "string_too_short") {
        const n = /at least (\d+)/.exec(innerMsg)?.[1];
        translated = n ? `не короче ${n} символов` : "слишком короткое значение";
    } else if (innerType === "too_short") {
        translated = "слишком мало элементов";
    } else if (innerType === "too_long") {
        translated = "слишком много элементов";
    } else if (innerType === "value_error") {
        translated = innerMsg.replace(/^Value error, /, "");
    } else if (innerMsg) {
        translated = translatePydanticMsg(innerMsg, lastSegment);
    }

    if (!translated) {
        return `Содержимое блока${field ? ` (${field})` : ""}: некорректные данные.`;
    }
    return `Содержимое блока${field ? ` (${field})` : ""}: ${translated}.`;
}

function formatValidationErrors(detail: ValidationErrorItem[]): string {
    const parts: string[] = [];

    for (const item of detail) {
        const rawMsg = typeof item.msg === "string" ? item.msg : "";
        if (!rawMsg) continue;

        // Pydantic wraps raised ValueError as "Value error, <text>".
        const msg = rawMsg.startsWith("Value error, ")
            ? rawMsg.slice("Value error, ".length)
            : rawMsg;

        if (msg.startsWith("Incorrect payload data")) {
            parts.push(describePayloadError(msg));
            continue;
        }

        const field = fieldLabelFromLoc(item.loc);
        const translated = translatePydanticMsg(rawMsg, field);
        const text = field ? `Поле «${field}»: ${translated}` : translated;
        if (!parts.includes(text)) {
            parts.push(text);
        }
        if (parts.length >= 3) break;
    }

    if (!parts.length) return VALIDATION_ERROR_MESSAGE;

    const hidden = detail.length - parts.length;
    const joined = parts.join("; ");
    return hidden > 0 ? `${joined} и ещё ${hidden}.` : `${joined}.`;
}

export function getErrorMessage(error: unknown): string {
    if (error instanceof TypeError) {
        return NETWORK_ERROR_MESSAGE;
    }

    if (!isApiError(error)) {
        return error instanceof Error ? error.message : "";
    }

    const body = isErrorBody(error.body) ? error.body : undefined;

    const code = typeof body?.error === "string" ? body.error : undefined;
    if (code && ERROR_MESSAGES[code]) {
        return ERROR_MESSAGES[code];
    }

    const detail = body?.detail;

    if (Array.isArray(detail)) {
        const items = detail.filter(
            (item): item is ValidationErrorItem =>
                typeof item === "object" && item !== null,
        );
        if (items.length) {
            return formatValidationErrors(items);
        }
        return VALIDATION_ERROR_MESSAGE;
    }

    if (typeof detail === "string" && detail) {
        return DETAIL_TRANSLATIONS[detail] ?? detail;
    }

    return "";
}
