# Модуль auth

> Расположение: `backend/src/auth/`
> Импорты: `user`, `core` (`config`, `services`, `repositories`, `unit_of_work`,
> `mappers`, `schemas`, `errors`, `events`, `mailer`).

Модуль `auth` отвечает за **идентификацию, аутентификацию и безопасность
аккаунта**: регистрацию, вход, выпуск и ротацию токенов, сессии, сброс пароля и
подтверждение почты. Это точка входа для всей платформы — остальные фичи зависят
от access-токена, выпускаемого здесь.

---

## Архитектура

Модуль следует слоистой структуре проекта:

```
router → service → repository / unit_of_work → mapper → schemas → models
                    └── security.py (JWT + Argon2)
                    └── device_parser.py (User-Agent → имя устройства)
```

| Файл | Назначение |
| --- | --- |
| `router.py` | Тонкие маршруты FastAPI для префикса `/auth` (публичные + сессии). |
| `services.py` | Бизнес-логика: `AuthService`. Регистрация, вход, refresh, logout, сессии, сброс пароля, верификация почты. |
| `security.py` | Кодирование/декодирование JWT (access, reset, verification), хеширование паролей Argon2, генерация и хеширование refresh-токена. |
| `schemas.py` | Pydantic v2 схемы запросов/ответов (`BaseSchema`). |
| `models.py` | ORM-модель `RefreshToken`. |
| `repository.py` | `RefreshTokenRepository` (поиск, отзыв, запросы сессий). |
| `unit_of_work.py` | `AuthUnitOfWork` — объединяет репозитории `users` + `refresh_tokens`. |
| `mapper.py` | `AuthMapper` — `RefreshToken` ⇄ `RefreshTokenSchema`. |
| `exceptions.py` | Иерархия `AuthorizationError` (401). |
| `dependencies.py` | DI-обвязка: `AuthServiceDep`, `AuthUnitOfWorkDep`, `RefreshTokenRepositoryDep`. |
| `device_parser.py` | Разбор `User-Agent` в человекочитаемое имя устройства («Chrome on Windows»). |
| `utils.py` | `set_tokens_cookie` — запись http-only куки с токенами (для cookie-клиентов). |

> Модуль использует `UserRepository` (из `user`) для записей о пользователях;
> сама модель `User` принадлежит модулю `user`.

---

## Токены

Используются три вида токенов, подписанных одним `JWT_SECRET_KEY` /
`JWT_ALGORITHM`, но различающихся по назначению и содержимому payload.

| Токен | Тип | Payload | Срок жизни | Для чего |
| --- | --- | --- | --- | --- |
| Access-токен | JWT (поле `type` **отсутствует**) | `{sub: user_id, exp}` | `ACCESS_TOKEN_EXPIRE_MINUTES` (по умолч. **15 мин**) | Bearer-аутентификация на каждом защищённом запросе |
| Refresh-токен | Случайная строка (`secrets.token_urlsafe(48)`) | — (хранится только SHA-256 хеш) | `REFRESH_TOKEN_EXPIRE_DAYS` (по умолч. **7 дн**) | Ротация на `/auth/refresh`; идентифицирует сессии |
| Reset-токен | JWT | `{sub: user_id, type: "reset", exp}` | **15 мин** | `POST /auth/reset-password` |
| Verification-токен | JWT | `{sub: user_id, type: "verify", exp}` | **24 ч** | `POST /auth/verify-email` |

Ключевые моменты:

- **Access-токены короткоживущие** и stateless; в БД не хранятся.
- **Refresh-токены непрозрачные** и хранятся только в виде SHA-256 хеша
  (`security.hash_refresh_token`). Сырое значение уходит клиенту, но никогда не
  сохраняется на сервере.
- **Reset- и verification-токены** несут claim `type`; декодер отклоняет любой
  JWT, у которого `type` не совпадает с ожидаемым.

Настройки — в `src/core/config.py` (`settings.app`):

| Настройка | По умолчанию | Значение |
| --- | --- | --- |
| `JWT_SECRET_KEY` | (обязательна) | HMAC-секрет для подписи JWT |
| `JWT_ALGORITHM` | `HS256` | Алгоритм подписи JWT |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `15` | TTL access-токена |
| `REFRESH_TOKEN_EXPIRE_DAYS` | `7` | TTL refresh-токена |
| `FRONTEND_HOST` | `http://localhost:3000` | Используется для ссылок в письмах верификации/сброса |

### Настройки почты (SMTP)

Письма отправляются через SMTP (`aiosmtplib`). Все эти параметры живут в
`settings.mail`:

| Настройка | По умолчанию | Значение |
| --- | --- | --- |
| `MAIL_ENABLED` | `True` | Главный переключатель. При `False` письма **только логируются** (не отправляются) — удобно в dev. |
| `SMTP_HOST` | `localhost` | Хост SMTP-сервера. |
| `SMTP_PORT` | `1025` | Порт SMTP-сервера. |
| `SMTP_USERNAME` | `None` | Логин SMTP (опционально). |
| `SMTP_PASSWORD` | `None` | Пароль SMTP (опционально). |
| `SMTP_FROM` | `noreply@lms.local` | Адрес отправителя. |
| `SMTP_FROM_NAME` | `LMS` | Отображаемое имя в поле From. |
| `SMTP_USE_TLS` | `False` | Использовать TLS при подключении к SMTP-серверу. |
| `SMTP_TIMEOUT_SECONDS` | `10.0` | Таймаут подключения. |

Отправка писем **fail-soft**: неправильно настроенный или недоступный SMTP-сервер
никогда не ломает auth-флоу — ошибка логируется (см. `src/core/mailer/mailer.py`).

### Как тестировать письма локально

В репозитории уже есть контейнер [Mailpit](https://mailpit.axllent.org/) как
локальный SMTP-приёмник (`docker-compose.yaml`). Backend уже указывает на него по
умолчанию (`SMTP_HOST=localhost`, `SMTP_PORT=1025`, `MAIL_ENABLED=true`), так что
правки `.env` не нужны.

1. Запустить его:

   ```bash
   docker compose up -d mailpit
   ```

   - SMTP: `localhost:1025`
   - Веб-интерфейс входящих: `http://localhost:8025`

2. Инициировать флоу с письмом, например регистрацию:

   ```bash
   curl -X POST http://localhost:8000/api/v1/auth/register \
     -H "Content-Type: application/json" \
     -d '{"username":"demo","email":"demo@example.com","password":"password123"}'
   ```

3. Открыть `http://localhost:8025` — там письмо верификации/сброса со ссылкой
   `{FRONTEND_HOST}/verify-email?token=...`.

4. Либо открыть ссылку при запущенном фронтенде, либо скопировать `token` и
   дёрнуть эндпоинт напрямую: `POST /api/v1/auth/verify-email`.

Для `forgot-password` флоу такой же, но выдаёт reset-токен на 15 минут.

Альтернативы:

- `MAIL_ENABLED=false` → SMTP не используется; письма **только логируются**
  (`"Mail disabled; would send ..."`) — удобно, но кликабельной ссылки не будет.
- Реальный провайдер транзакционных писем (Mailtrap, Brevo и т.д.): задать
  `SMTP_HOST` / `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD`,
  `SMTP_USE_TLS=true` в `.env`.

### Rate limiting и защита от злоупотреблений

Auth-эндпоинты троттлятся Redis-счётчиком (fixed-window,
`src/core/rate_limit.py`). Настройки — `settings.rate_limit`
(`src/core/config.py`):

| Настройка | По умолчанию | Значение |
| --- | --- | --- |
| `RATE_LIMIT_GLOBAL_ENABLED` | `true` | Главный переключатель глобального per-IP guard (применяется ко всем запросам `/api/v1/*` в `src/main.py`). |
| `RATE_LIMIT_GLOBAL_REQ_PER_MIN` | `300` | Максимум запросов на IP в минуту до `429`. |
| `RATE_LIMIT_LOGIN_MAX_TRIES` | `5` | Максимум неудачных попыток на IP *и* на username в рамках окна. |
| `RATE_LIMIT_LOGIN_WINDOW_SECONDS` | `900` | Окно для login (секунды). Блокировка/локдаут длится столько. |
| `RATE_LIMIT_EMAIL_MAX_REQUESTS` | `3` | Максимум `forgot-password` / `resend-verification` на IP *и* на почту в рамках окна. |
| `RATE_LIMIT_EMAIL_WINDOW_SECONDS` | `3600` | Окно email-флуда (секунды). |
| `RATE_LIMIT_TRUSTED_PROXY_IPS` | `[]` | IP-адреса reverse-прокси / load balancer (через запятую) для резолва реального IP клиента из `X-Forwarded-For`. |

Счётчик сбрасывается при успешном входе. `429` рендерится как
`RateLimitExceededError` с заголовком `Retry-After`.

---

## Эндпоинты

Базовый путь: `/api/v1/auth`. Все ответы используют общий формат ошибок
`{error, detail}`.

### Регистрация и вход (публичные)

| Метод | Путь | Тело | Успех | Примечания |
| --- | --- | --- | --- | --- |
| `POST` | `/register` | `UserRegisterSchema {username, email, password}` | `201` `UserPublicSchema` + заголовок `Location` | Создаёт пользователя (`is_verified=False`) и отправляет письмо верификации. |
| `POST` | `/login` | OAuth2-форма: `username`, `password` | `200` `TokenPair` | Возвращает `{access_token, refresh_token, token_type}`. Также фиксирует `ip_address` + `user_agent`. **Rate-limit** (429) по IP и по username; при ошибке — единый `InvalidCredentialsError` (без перебора аккаунтов). |

> `register` возвращает `UserPublicSchema` (без `email` и `password_hash`) —
> публичные PII сознательно сокращены.

### Токены и выход (смешанные)

| Метод | Путь | Тело | Аутентификация | Успех |
| --- | --- | --- | --- | --- |
| `POST` | `/refresh` | `{refresh_token}` | отсутствует | `200` `TokenPair` (новая пара, прежний refresh-токен отзывается) |
| `POST` | `/logout` | `{refresh_token}` | access-токен | `204` — отзывает refresh-токен |

### Сессии (нужен access-токен; auth-only — верификация почты **не** требуется)

| Метод | Путь | Query | Успех | Примечания |
| --- | --- | --- | --- | --- |
| `GET` | `/sessions` | `current_token` (текущий refresh-токен) | `200` `list[SessionSchema]` | Активные сессии, новые сверху; текущая помечается `is_current`. |
| `DELETE` | `/sessions/{session_id}` | — | `204` | Отозвать одну сессию. |
| `DELETE` | `/sessions` | `current_token` | `204` | Отозвать все **остальные** сессии (текущая сохраняется). |

### Пароль и почта (публичные)

| Метод | Путь | Тело | Успех |
| --- | --- | --- | --- |
| `POST` | `/forgot-password` | `{email}` | `200` `ForgotPasswordResponseSchema` — всегда одинаковое сообщение; не раскрывает, существует ли почта |
| `POST` | `/reset-password` | `{token, new_password}` | `200` `{message}` |
| `POST` | `/verify-email` | `{token}` | `200` `MessageResponseSchema` |
| `POST` | `/resend-verification` | `{email}` | `200` `MessageResponseSchema` — шлёт, только если пользователь существует и ещё не подтверждён |

---

## Флоу

### 1. Регистрация + верификация почты

1. `POST /auth/register` → `AuthService.register` (services.py):
   - хеширует пароль **Argon2** (`security.hash_password`);
   - создаёт `User` с `is_verified=False`;
   - отправляет письмо верификации (`send_verification_email`) со ссылкой
     `{FRONTEND_HOST}/verify-email?token=...`.
2. Пользователь переходит по ссылке → `POST /auth/verify-email` →
   `AuthService.verify_email`:
   - `decode_verification_token` → требует JWT `type == "verify"`;
   - выставляет `is_verified=True` и `email_verified_at=now` (идемпотентно).
3. После подтверждения пользователь получает полный доступ (см. **Гейт верификации почты**).

Отправка писем **fail-soft**: если `MAIL_ENABLED` выключен или SMTP-вызов
бросает исключение, ошибка логируется, а флоу продолжается — регистрация никогда
не блокируется из-за неверно настроенного почтового сервера.

### 2. Вход → пара токенов

`AuthService.login` сначала применяет **брутфорс-защиту** (по IP и по username,
через Redis — `settings.rate_limit`), затем проверяет пароль. При любой ошибке
(неизвестный username, неверный пароль или деактивированный аккаунт) возвращается
единый `InvalidCredentialsError` (401) — код никогда не различает эти случаи,
поэтому злоумышленник не может перебирать валидные username. Когда username не
найден, сервис всё равно выполняет Argon2-проверку по dummy-хешу, чтобы выровнять
время (нет timing-oracle). При успехе определяется имя устройства из `User-Agent`,
создаётся запись `RefreshToken` (хранится только её хеш, а также `ip_address` /
`user_agent` / `device_name`), сбрасываются счётчики лимита и возвращается
`TokenPair`.

### 3. Refresh (с ротацией)

`POST /auth/refresh` принимает refresh-токен; сервис:

1. ищет сырой токен по его **хешу**;
2. отклоняет просроченные или отозванные токены;
3. **если токен уже был отозван → расценивает это как переиспользование**
   (возможная кража) и отзывает **все** refresh-токены этого пользователя;
4. иначе отзывает предъявленный токен (ротация) и выдаёт новую пару `TokenPair`.

> Деактивированный пользователь (`is_active=False`) принудительно разлогинивается
> при первой же попытке refresh: все его сессии отзываются и возвращается
> `401 InvalidRefreshTokenError`, так что он не может поддерживать сессию
> ротацией токенов.

### 4. Сессии

Записи refresh-токенов одновременно являются **сессиями**.
`GET /auth/sessions` возвращает неотозванные, непросроченные токены, новые сверху;
клиент передаёт свой текущий refresh-токен через `current_token`, чтобы UI мог
пометить его как `is_current`. `DELETE /sessions/{id}` отзывает одну;
`DELETE /sessions` — все, кроме текущей.

### 5. Сброс пароля

1. `POST /auth/forgot-password` → если пользователь с такой почтой существует,
   отправляет ссылку сброса (`{FRONTEND_HOST}/reset-password?token=...`). Ответ
   одинаков в любом случае (нет перебора аккаунтов). Эндпоинт **rate-limited**
   (429) по IP и по почте — защита от флуда письмами.
2. `POST /auth/reset-password` → `decode_reset_token` (нужен `type == "reset"`,
   TTL 15 мин) → обновляет хеш пароля и **отзывает все активные refresh-токены /
   сессии** пользователя, поэтому украденная сессия инвалидируется сменой пароля.
   Пользователь должен войти заново.

---

## Гейт верификации почты

Верификация почты — это **реальное** ограничение. Оно enforced централизованно в
`src/user/dependencies.py` через `get_current_user_id` (которое питает `UserIdDep`,
`CurrentUserDep` и `StaffDep`). Любой защищённый эндпоинт бросает
`UserNotVerifiedError` (`403`, detail `"Email not verified"`), пока у пользователя
`is_verified=True` не выставлено.

Матрица зависимостей:

| Зависимость | Нужен access-токен | Нужна верификация | Где используется |
| --- | --- | --- | --- |
| `AuthenticatedUserIdDep` / `AuthenticatedCurrentUserDep` | ✅ | ❌ | **auth-only**: `/users/me`, `/users/{id}`, пароль, сессии, logout, уведомления, медиа, свои оплаты/сертификаты/статистика профиля |
| `UserIdDep` / `CurrentUserDep` / `StaffDep` | ✅ | ✅ | **требуют верификации**: CRUD курсов/модулей/уроков/блоков, сабмишены, запись на курс, AI-генерация, TGP, отзывы, оплата (checkout), модерация |
| `OptionalUserIdDep` | опционально | — | **публичные**: анонимное чтение (каталог курсов, карточка курса) |

Практическое следствие для неподтверждённого пользователя:

- ✅ может регистрироваться, входить, подтверждать почту, управлять аккаунтом
  (профиль, настройки, аватар, пароль, сессии, уведомления, свои покупки/
  сертификаты);
- ✅ может смотреть публичный каталог и читать опубликованные карточки курсов;
- ❌ не может создавать / публиковать / управлять контентом, записываться на
  курс, оставлять сабмишены, генерировать AI-контент, оплачивать курс или писать
  отзывы — эти действия возвращают `403 UserNotVerifiedError`.

`403` с ошибкой `"UserNotVerifiedError"` обрабатывается на фронтенде редиректом
на `/verify-email`.

---

## Безопасность

- **Пароли**: Argon2 через `pwdlib` (никогда не в открытом виде).
- **Refresh-токены**: непрозрачные + SHA-256-хеш в БД; сырое значение есть только
  у клиента; ротация при каждом использовании; детект переиспользования отзывает
  все сессии.
- **Метаданные сессии**: каждый refresh-токен хранит `ip_address`, `user_agent` и
  разобранный `device_name` для UI сессий.
- **Нет перебора аккаунтов**: login возвращает единый `InvalidCredentialsError`
  для неизвестного username / неверного пароля / деактивированного аккаунта,
  а Argon2-проверка выполняется по dummy-хешу при отсутствующем username
  (timing-safe). `forgot-password` и `resend-verification` всегда возвращают
  одинаковое сообщение.
- **Защита от брутфорса и флуда письмами**: login лимитируется по IP + username,
  forgot/resend — по IP + почта (`RateLimitExceededError`, 429); глобальный
  per-IP guard применяется в мидлваре `src/main.py` ко всем запросам `/api/v1/*`.
- **Деактивированные аккаунты** (`is_active=False`) не могут зайти и обновить
  токен — сессии отзываются при первой попытке refresh (при login
  `UserNotActiveError` не раскрывается, но аутентифицированные запросы возвращают
  `403 UserNotActiveError`).
- **Сброс пароля отзывает сессии**: reset-password инвалидирует все refresh-токены
  пользователя (см. флоу 5).
- **Куки**: `set_tokens_cookie` (utils.py) ставит http-only, `SameSite=Lax` куки;
  `secure` зависит от `settings.app.secure_cookies`. Refresh-кука ограничена путём
  `/api/v1/auth/refresh`.
- **Fail-soft почта**: ошибки почты логируются, но не прокидываются в auth-флоу.

---

## Ошибки

Все ошибки auth наследуют `AuthorizationError` → `AppException` (HTTP `401`) и
рендерятся глобальным обработчиком как `{error, detail}`:

| Исключение | detail |
| --- | --- |
| `InvalidCredentialsError` | `"Incorrect username or password"` — единая ошибка входа (неизвестный пользователь / неверный пароль / деактивированный аккаунт) |
| `InvalidAccessTokenError` | `"Invalid access token"` |
| `InvalidRefreshTokenError` | `"Invalid refresh token"` |
| `NoRefreshTokenError` | `"No refresh token"` |

Связанные ошибки из других модулей:

| Исключение | Откуда | HTTP |
| --- | --- | --- |
| `UserNotFoundError` | `user` | 404 |
| `UserAlreadyExistsError` | `user` | 409 |
| `UserNotVerifiedError` | `user` | 403 |
| `UserNotActiveError` | `user` | 403 |
| `RateLimitExceededError` | `core` | 429 |

---

## Связанные файлы

- `src/core/dependencies.py` — `AccessTokenDep` (oauth2 bearer), `SessionDep`,
  `EventBusDep`.
- `src/core/mailer/mailer.py` — `send_verification_email`, `send_password_reset_email`.
- `src/core/rate_limit.py` — Redis fixed-window `RateLimiter`, `get_client_ip`.
- `src/core/errors/base_errors.py` — `RateLimitExceededError` (429).
- `src/user/dependencies.py` — `UserIdDep`, `AuthenticatedUserIdDep`,
  `CurrentUserDep`, `StaffDep`, `OptionalUserIdDep`; гейт верификации.
- `src/core/config.py` — `settings.app` (JWT/TTL/host) и `settings.mail`.
