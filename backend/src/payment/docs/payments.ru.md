# Оплата (модуль `payment`)

Модуль отвечает за покупку платных курсов: чекаут, обработка вебхуков платёжного
провайдера, запись пользователя в курс, историю покупок и реквизиты выплат
авторов.

Провайдер по умолчанию — **YooKassa (YooMoney)**, метод оплаты — **SBP (QR)**
с фаллбеком на остальные способы (банковская карта / кошелёк). Для локальной
разработки без реальных ключей есть **mock-режим**.

## Схема данных

- `Payment` (`models.py`) — одна запись на попытку покупки. Статусы:
  `pending` → `succeeded` (по вебхуку `payment.succeeded`) или `failed`.
  Хранит сумму, `platform_fee` (комиссия платформы) и `author_amount` (доля автора).
- `PayoutAccount` — платёжные реквизиты автора (карта или телефон для SBP-выплат).

## Flow покупки

1. `POST /api/v1/payments/courses/{id}/checkout` → `PaymentService.create_checkout`.
2. Создаётся запись `Payment` со статусом `pending` и суммой `course.price`.
3. Провайдеру уходит запрос на создание платежа (сначала SBP/QR, при ошибке — фаллбек).
4. Возвращается `confirmation_url`, на который редиректится пользователь.
5. После оплаты провайдер шлёт вебхук `payment.succeeded` на
   `POST /api/v1/payments/webhook/yookassa`.
6. Обработчик помечает платёж `succeeded` и вызывает `_enroll_if_needed` —
   пользователь записывается в курс (`CourseMember`).

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
| `PAYMENT_PLATFORM_FEE_PERCENT` | `10.0` | Комиссия платформы, % от суммы покупки. `platform_fee = round(amount * fee% / 100)`. |
| `PAYOUT_PLATFORM_RECIPIENT` | `""` | Реквизиты получателя платформенной доли (отображается в UI через `GET /api/v1/payments/config`). |

### Свойства-помощники

- `payments.enabled` — `true`, если заданы и `YOOKASSA_SHOP_ID`, и `YOOKASSA_SECRET_KEY`.
- `payments.mode` — возвращает `PAYMENT_PROVIDER_MODE`.

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

- Вебхук YooKassa не подписывается HMAC — доверие строится на IP-whitelist
  (`src/payment/security.py`) и на том, что платёж уже существует в `pending`
  у нас в БД (`provider_payment_id`).
- В тестовом магазине YooKassa текст/код «SBP недоступен» может отличаться —
  тогда фаллбек не сработает (список хинтов в `_SBP_UNAVAILABLE_HINTS`).
- Файл `.env` нигде не коммитится — секреты (`YOOKASSA_SECRET_KEY`) только локально.
