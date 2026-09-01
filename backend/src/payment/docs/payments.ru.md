# Оплата (модуль `payment`)

Модуль отвечает за покупку платных курсов: чекаут, обработка вебхуков платёжного
провайдера, запись пользователя в курс и историю покупок.

Провайдер по умолчанию — **YooKassa (YooMoney)**, метод оплаты — **SBP (QR)**
с фаллбеком на остальные способы (банковская карта / кошелёк). Для локальной
разработки без реальных ключей есть **mock-режим**.

> **Модель монетизации (до релиза).** В бете платформа — единственный магазин:
> магазин YooKassa получает **100%** от каждой покупки (минус комиссия YooKassa
> за приём), а комиссия платформы — **0%** (`PAYMENT_PLATFORM_FEE_PERCENT=0`).
> Выплаты авторам — **вручную / отложены** — см.
> [Бизнес-модель (до релиза)](#бизнес-модель-до-релиза).

## Схема данных

- `Payment` (`models.py`) — одна запись на попытку покупки. Статусы:
  `pending` → `succeeded` (по вебхуку `payment.succeeded`) или `failed`.
  Хранит сумму, а также `platform_fee` / `author_amount` — **только как учёт**
  (считаются, но разделение **не исполняется** — все деньги идут на магазин
  платформы).
- `PayoutAccount` — платёжные реквизиты автора (карта или телефон для SBP-выплат),
  сохраняются для **будущих** ручных выплат; автоматическая выплата не выполняется.

## Flow покупки

1. `POST /api/v1/payments/courses/{id}/checkout` → `PaymentService.create_checkout`.
2. Создаётся запись `Payment` со статусом `pending` и суммой `course.price`.
3. Провайдеру уходит запрос на создание платежа (сначала SBP/QR, при ошибке — фаллбек).
4. Возвращается `confirmation_url`, на который редиректится пользователь.
5. После оплаты провайдер шлёт вебхук `payment.succeeded` на
   `POST /api/v1/payments/webhook/yookassa`.
6. Обработчик **заново запрашивает платёж у YooKassa** (`GET /v3/payments/{id}`)
   по аутентифицированному (Basic auth) соединению, сверяет `status`, `amount`,
   `currency` и `metadata.course_id` / `metadata.user_id` с записью, созданной на
   чекауте, затем помечает его `succeeded` и вызывает `_enroll_if_needed` —
   пользователь записывается в курс (`CourseMember`).

### Верификация вебхука (источник истины)

Тело вебхука — это **сигнал**, а не источник истины. YooKassa **не подписывает**
уведомления HMAC-подписью, поэтому данные в payload (`status`, `amount`,
`metadata`) можно подделать. Достоверные данные берутся из
`YooKassaClient.get_payment()` (`service.py:_verify_payment`), которая использует
HTTP Basic-логин магазина:

- `status` должен быть равен `"succeeded"`;
- `amount.currency` должен совпадать со `Payment.currency` (`RUB`);
- `amount.value` (приводится к копейкам) должен совпадать с `Payment.amount` —
  таким образом вебхук с другой/подделанной суммой отклоняется, даже если
  `provider_payment_id` утёк;
- `metadata.course_id` должен совпадать с `Payment.course_id`;
- `metadata.user_id` должен совпадать с `Payment.user_id`.

При любом несовпадении сервис выбрасывает `PaymentVerificationError` (**403**, без
зачисления). Транзиентная ошибка провайдера/сети — `PaymentProviderError`
(**502**), чтобы YooKassa продолжала повторять доставку. Исключения:
`src/payment/exceptions.py`.

## Фаллбек SBP → другие способы

В `client.py` первым делом отправляется `payment_method_data={"type":"sbp"}`
(QR). Если провайдер отвечает `400` с признаками «SBP недоступен»
(код `invalid_request` или текст `payment method is not available`), клиент
логирует предупреждение и повторяет запрос уже без `payment_method_data`
(Smart payment — карта/кошелёк).

## Повторный вход после отписки

Если пользователь уже оплатил курс, а затем отписался, при повторной записи
(`POST /courses/{id}/members`) платёж не требуется: `enroll()` проверяет
`_is_paid()` и разрешает бесплатную запись. Фронтенд при
`paid && !isMember` (без свежего чекаута) показывает кнопку «Записаться на курс».

## Переменные окружения (backend)

Имена совпадают с полями `PaymentSettings` в `src/core/config.py` (читаются из
`backend/.env`).

| Переменная | По умолчанию | Описание |
| --- | --- | --- |
| `YOOKASSA_SHOP_ID` | `""` | Идентификатор магазина (shop_id) из кабинета YooKassa. Вместе с `YOOKASSA_SECRET_KEY` включает реальный провайдер (`enabled = true`). |
| `YOOKASSA_SECRET_KEY` | `""` | Секретный ключ API магазина YooKassa. |
| `YOOKASSA_RETURN_URL` | `http://localhost:3000` | **Задекларирована, но пока не используется** — фактический URL возврата собирается из `app.FRONTEND_HOST` (`/courses/{course_id}`) в `create_checkout`. |
| `PAYMENTS_SANDBOX` | `true` | **Задекларирована, но пока не используется** в коде (резерв под тестовый режим YooKassa). |
| `PAYMENT_PROVIDER_MODE` | `yookassa` | `yookassa` — реальный YooKassa; `mock` — локальный симулятор без ключей (см. ниже). |
| `MOCK_SBP_AVAILABLE` | `true` | Только для mock: `true` — вернуть SBP/QR чекаут; `false` — имитировать «SBP недоступен», чтобы отработал фаллбек на другие способы. |
| `MOCK_CONFIRMATION_URL` | `http://localhost:5173/mock-payment` | Только для mock: URL, на который мок «редиректит» пользователя, чтобы открылась страница-симулятор оплаты. |
| `MOCK_RAISE_NETWORK` | `false` | Только для mock: `true` — имитировать сетевую ошибку провайдера (платёж помечается `failed`, выбрасывается `PaymentProviderError`). |
| `PAYMENT_WEBHOOK_DEV_ACCEPT` | `false` | Dev-only: при `true` вебхук принимается с `localhost/127.0.0.1/::1` (реальные вебхуки YooKassa не могут достучаться до локального dev-сервера). |
| `PAYMENT_PLATFORM_FEE_PERCENT` | `0.0` | Комиссия платформы, % от суммы покупки. **0 в бете** — `platform_fee = round(amount * fee% / 100)`. |
| `PAYOUT_PLATFORM_RECIPIENT` | `""` | Реквизиты получателя платформенной доли (отображается в UI через `GET /api/v1/payments/config`). |
| `YOOKASSA_TRUSTED_PROXY_IPS` | `""` | IP-адреса доверенных reverse-прокси / load balancer (например nginx, traefik), через запятую. Если socket-пир — один из них, реальный IP клиента берётся из цепочки `X-Forwarded-For`, чтобы IP-whitelist YooKassa работал за прокси. Оставить пустым, когда вебхук попадает в uvicorn напрямую. |

### Свойства-помощники

- `payments.enabled` — `true`, если заданы и `YOOKASSA_SHOP_ID`, и `YOOKASSA_SECRET_KEY`.
- `payments.mode` — возвращает `PAYMENT_PROVIDER_MODE`.

### Модель доверия вебхуку

Два наложенных слоя (`src/payment/security.py` + `src/payment/service.py`):

1. **IP-whitelist (defense-in-depth).** `is_trusted_yookassa_ip()` принимает только
   официальные подсети YooKassa. Когда запрос проходит через доверенный прокси
   (`YOOKASSA_TRUSTED_PROXY_IPS`), `resolve_client_ips()` добавляет ближайший
   недоверенный хоп из `X-Forwarded-For`; при прямом запросе заголовок
   игнорируется, поэтому подделанный `X-Forwarded-For` не обманет whitelist.
2. **Авторитетная ре-верификация через API** (см. выше) — именно она фактически
   решает, зачислять ли платёж.

`PAYMENT_WEBHOOK_DEV_ACCEPT` (доставка с localhost) срабатывает только при
`PAYMENT_PROVIDER_MODE=mock`, поэтому утёкший флаг в продакшене нельзя
использовать, чтобы бесплатно зачислить курс с localhost.

## Mock-режим для локальной проверки

Пример `backend/.env`:

```ini
PAYMENT_PROVIDER_MODE=mock
MOCK_SBP_AVAILABLE=true      # true = SBP/QR, false = фаллбек на атрибуты
MOCK_RAISE_NETWORK=false     # true = смоделировать сетевую ошибку -> FAILED
PAYMENT_WEBHOOK_DEV_ACCEPT=true
MOCK_CONFIRMATION_URL=http://localhost:5173/mock-payment
```

Сценарии:

1. **QR**: `MOCK_SBP_AVAILABLE=true` → `create_checkout` возвращает
   `confirmation_url` вида `.../mock-payment?qr=1&provider_id=mock_...&course_id=...`.
2. **Фаллбек**: `MOCK_SBP_AVAILABLE=false` → SBP даёт `400` с хинтом, отрабатывает
   настоящая ветка фаллбека → `confirmation_url` с `qr=0`.
3. **Сетевая ошибка**: `MOCK_RAISE_NETWORK=true` → платёж помечается `failed`.
4. **Полный сценарий покупки**: открыть `/mock-payment`, нажать
   «Симулировать успешную оплату» — страница шлёт вебхук `payment.succeeded` на
   бэкенд (нужен `PAYMENT_WEBHOOK_DEV_ACCEPT=true`), пользователь записывается и
   редиректится на страницу курса.

## Ограничения и заметки

- Вебхук YooKassa не подписывается HMAC, поэтому телу вебхука никогда нельзя
  доверять. Обработчик опирается на **IP-whitelist** и **аутентифицированную
  ре-верификацию `GET /v3/payments/{id}`**, и продвигает только запись, которая
  уже существует в состоянии `pending` (`provider_payment_id`).
- За reverse-прокси задайте `YOOKASSA_TRUSTED_PROXY_IPS`; иначе
  `request.client.host` — это IP прокси, и реальный IP YooKassa теряется.
- В тестовом магазине YooKassa текст/код «SBP недоступен» может отличаться —
  тогда фаллбек не сработает (список хинтов в `_SBP_UNAVAILABLE_HINTS`).
- **Нет авто-выплат авторам.** `PayoutAccount` хранится, но в бете деньги авторам
  не переводятся — все поступления остаются платформе.
- Файл `.env` нигде не коммитится — секреты (`YOOKASSA_SECRET_KEY`) только локально.

## Бизнес-модель (до релиза)

Платформа запускает программу **«Авторы-Основатели» (Beta Founders)** до
публичного релиза:

- **0% комиссии платформы в бете** — вся выручка идёт платформе (единственному
  магазину YooKassa) на развитие продукта. Авторы в бете **не получают** выплат;
  выплаты появятся после запуска стандартной модели монетизации.
- **Пожизненный статус Основателя** (`User.is_founder`) выдаётся автору
  автоматически в момент **публикации** курса, пока программа открыта. Флаг
  записывается навсегда, чтобы позже было однозначно, кто стал основателем.
- **Окно программы** (настраивается через `settings.founder` в
  `src/core/config.py`): программа закрывается только когда **и** суммарная
  выручка SUCCEEDED-платежей достигает `FOUNDER_PROGRAM_REVENUE_LIMIT`
  (50 000 ₽), **и** `FOUNDER_PROGRAM_MAX_AUTHORS` (30 авторов) получили статус.
  Достижение только одного лимита программу не закрывает; даты нет. Лимиты по
  деньгам/курсам не дают «накликать» статус пустыми курсами.
- **Привилегии основателей (после релиза, отложено):** пожизненная
  `FOUNDER_COMMISSION_PERCENT` (5% вместо стандартных 10%), повышающий
  коэффициент в ленте рекомендаций на 12 месяцев, кастомный лендинг, отсутствие
  минимального порога вывода на 12 месяцев, приоритетная поддержка. В коде пока
  не реализовано.

Где живёт:

- `settings.founder` (`FOUNDER_PROGRAM_ENABLED`, `FOUNDER_PROGRAM_REVENUE_LIMIT`,
  `FOUNDER_PROGRAM_MAX_AUTHORS`, `FOUNDER_COMMISSION_PERCENT`).
- `src/founder/service.py` — `grant_founder_if_eligible()`, вызывается при
  публикации курса (`CourseService.approve_course`) и авто-публикации AI
  (`ai.course_review.task`).
- `User.is_founder` / `founder_at`; `CourseSchema.owner_is_founder` (бейдж
  «Основатель» рядом с автором и в профиле автора).
