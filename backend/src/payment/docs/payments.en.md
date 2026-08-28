# Payments (module `payment`)

This module handles purchasing paid courses: checkout, payment-provider webhook
processing, enrolling the user, purchase history, and author payout details.

The default provider is **YooKassa (YooMoney)**, the payment method is **SBP (QR)**
with a fallback to other methods (bank card / wallet). For local development
without real credentials there is a **mock mode**.

## Data model

- `Payment` (`models.py`) — one row per purchase attempt. Statuses:
  `pending` → `succeeded` (on the `payment.succeeded` webhook) or `failed`.
  Stores the amount, `platform_fee` (platform commission) and `author_amount`
  (author share).
- `PayoutAccount` — an author's payout details (card or phone for SBP payouts).

## Purchase flow

1. `POST /api/v1/payments/courses/{id}/checkout` → `PaymentService.create_checkout`.
2. A `Payment` row is created with status `pending` and `amount = course.price`.
3. A payment is created at the provider (first SBP/QR, on failure — fallback).
4. A `confirmation_url` is returned and the user is redirected to it.
5. After payment the provider sends a `payment.succeeded` webhook to
   `POST /api/v1/payments/webhook/yookassa`.
6. The handler marks the payment `succeeded` and calls `_enroll_if_needed` —
   the user is enrolled in the course (`CourseMember`).

## SBP → other methods fallback

In `client.py` the first request always sends
`payment_method_data={"type":"sbp"}` (QR). If the provider replies `400` with
signs that SBP is unavailable (code `invalid_request` or text
`payment method is not available`), the client logs a warning and retries with no
`payment_method_data` (Smart payment — card/wallet).

## Re-entry after unsubscribing

If a user already paid for a course and then unsubscribed, no payment is required
to re-enroll: `enroll()` (via `POST /courses/{id}/members`) checks `_is_paid()`
and allows a free re-enrollment. The frontend shows a "Enroll" button when
`paid && !isMember` (no fresh checkout).

## Environment variables (backend)

Names match the `PaymentSettings` fields in `src/core/config.py` (read from
`backend/.env`).

| Variable | Default | Description |
| --- | --- | --- |
| `YOOKASSA_SHOP_ID` | `""` | Shop ID from the YooKassa dashboard. Together with `YOOKASSA_SECRET_KEY` enables the real provider (`enabled = true`). |
| `YOOKASSA_SECRET_KEY` | `""` | Shop secret API key for YooKassa. |
| `YOOKASSA_RETURN_URL` | `http://localhost:3000` | **Declared but not currently wired** — the actual return URL is built from `app.FRONTEND_HOST` (`/courses/{course_id}`) in `create_checkout`. |
| `PAYMENTS_SANDBOX` | `true` | **Declared but not currently used** in code (reserved for a YooKassa test mode). |
| `PAYMENT_PROVIDER_MODE` | `yookassa` | `yookassa` — real YooKassa; `mock` — local simulator without keys (see below). |
| `MOCK_SBP_AVAILABLE` | `true` | Mock only: `true` — return an SBP/QR checkout; `false` — simulate "SBP unavailable" so the fallback actually runs. |
| `MOCK_CONFIRMATION_URL` | `http://localhost:5173/mock-payment` | Mock only: URL the mock "redirects" to, opening the payment simulator page. |
| `MOCK_RAISE_NETWORK` | `false` | Mock only: `true` — simulate a provider network error (payment is marked `failed`, `PaymentProviderError` raised). |
| `PAYMENT_WEBHOOK_DEV_ACCEPT` | `false` | Dev only: when `true`, the webhook is accepted from `localhost/127.0.0.1/::1` (real YooKassa webhooks cannot reach a local dev server). |
| `PAYMENT_PLATFORM_FEE_PERCENT` | `10.0` | Platform commission (% of the purchase amount). `platform_fee = round(amount * fee% / 100)`. |
| `PAYOUT_PLATFORM_RECIPIENT` | `""` | Payout details of the platform amount recipient (shown via `GET /api/v1/payments/config`). |

### Helper properties

- `payments.enabled` — `true` when both `YOOKASSA_SHOP_ID` and `YOOKASSA_SECRET_KEY`
  are set.
- `payments.mode` — returns `PAYMENT_PROVIDER_MODE`.

## Mock mode for local testing

Example `backend/.env`:

```ini
PAYMENT_PROVIDER_MODE=mock
MOCK_SBP_AVAILABLE=true      # true = SBP/QR, false = fallback to card/wallet
MOCK_RAISE_NETWORK=false     # true = simulate network error -> FAILED
PAYMENT_WEBHOOK_DEV_ACCEPT=true
MOCK_CONFIRMATION_URL=http://localhost:5173/mock-payment
```

Scenarios:

1. **QR**: `MOCK_SBP_AVAILABLE=true` → `create_checkout` returns a
   `confirmation_url` like `.../mock-payment?qr=1&provider_id=mock_...&course_id=...`.
2. **Fallback**: `MOCK_SBP_AVAILABLE=false` → SBP returns `400` with the hint and the
   real fallback branch runs → `confirmation_url` with `qr=0`.
3. **Network error**: `MOCK_RAISE_NETWORK=true` → payment is marked `failed`.
4. **Full purchase flow**: open `/mock-payment`, click
   "Simulate successful payment" — the page sends a `payment.succeeded` webhook
   to the backend (requires `PAYMENT_WEBHOOK_DEV_ACCEPT=true`), the user is
   enrolled and redirected to the course page.

## Limitations & notes

- The YooKassa webhook is not HMAC-signed — trust is based on the IP whitelist
  (`src/payment/security.py`) and on the payment already existing in `pending`
  state in our DB (`provider_payment_id`).
- In a YooKassa test shop the "SBP unavailable" text/code may differ — then the
  fallback won't trigger (hint list is `_SBP_UNAVAILABLE_HINTS`).
- `.env` is never committed — secrets (`YOOKASSA_SECRET_KEY`) stay local only.
