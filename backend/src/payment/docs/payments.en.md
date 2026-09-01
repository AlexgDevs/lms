# Payments (module `payment`)

This module handles purchasing paid courses: checkout, payment-provider webhook
processing, enrolling the user, and purchase history.

The default provider is **YooKassa (YooMoney)**, the payment method is **SBP (QR)**
with a fallback to other methods (bank card / wallet). For local development
without real credentials there is a **mock mode**.

> **Monetization model (pre-launch).** During the beta the platform is the single
> merchant: a YooKassa shop receives **100%** of every purchase (minus the
> YooKassa processing fee), and the platform commission is **0%**
> (`PAYMENT_PLATFORM_FEE_PERCENT=0`). Author payouts are **manual / deferred** —
> see [Business model (pre-launch)](#business-model-pre-launch).

## Data model

- `Payment` (`models.py`) — one row per purchase attempt. Statuses:
  `pending` → `succeeded` (on the `payment.succeeded` webhook) or `failed`.
  Stores the amount plus `platform_fee` / `author_amount` as **accounting only**
  (they are computed, but the split is **not** executed — all money goes to the
  platform shop).
- `PayoutAccount` — an author's payout details (card or phone for SBP payouts),
  recorded for **future** manual payouts; no automatic payout is executed.

## Purchase flow

1. `POST /api/v1/payments/courses/{id}/checkout` → `PaymentService.create_checkout`.
2. A `Payment` row is created with status `pending` and `amount = course.price`.
3. A payment is created at the provider (first SBP/QR, on failure — fallback).
4. A `confirmation_url` is returned and the user is redirected to it.
5. After payment the provider sends a `payment.succeeded` webhook to
   `POST /api/v1/payments/webhook/yookassa`.
6. The handler **re-fetches the payment from YooKassa** (`GET /v3/payments/{id}`)
   over an authenticated (Basic auth) connection, verifies `status`, `amount`,
   `currency` and `metadata.course_id` / `metadata.user_id` against the row
   created at checkout, then marks it `succeeded` and calls `_enroll_if_needed` —
   the user is enrolled in the course (`CourseMember`).

### Webhook verification (source of truth)

The webhook body is treated as a **signal**, not the source of truth. YooKassa
does **not** HMAC-sign notifications, so the payload (`status`, `amount`,
`metadata`) can be forged. The authoritative facts are therefore obtained from
`YooKassaClient.get_payment()` (`service.py:_verify_payment`), which uses the
shop's HTTP Basic credentials:

- `status` must equal `"succeeded"`;
- `amount.currency` must equal the stored `Payment.currency` (`RUB`);
- `amount.value` (parse to kopecks) must equal the stored `Payment.amount`,
  so a webhook for a different/forged amount is rejected even if a
  `provider_payment_id` leaked;
- `metadata.course_id` must equal the stored `Payment.course_id`;
- `metadata.user_id` must equal the stored `Payment.user_id`.

On any mismatch the service raises `PaymentVerificationError` (**403**, no
enrollment). A transient provider/network error raises `PaymentProviderError`
(**502**) so YooKassa keeps retrying delivery. Exceptions:
`src/payment/exceptions.py`.

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
| `PAYMENT_PLATFORM_FEE_PERCENT` | `0.0` | Platform commission (% of the purchase amount). **0 during the beta** — `platform_fee = round(amount * fee% / 100)`. |
| `PAYOUT_PLATFORM_RECIPIENT` | `""` | Payout details of the platform amount recipient (shown via `GET /api/v1/payments/config`). |
| `YOOKASSA_TRUSTED_PROXY_IPS` | `""` | Comma-separated IPs of trusted reverse proxies / load balancers (e.g. nginx, traefik). When the socket peer is one of them, the real client IP is resolved from the `X-Forwarded-For` chain so the YooKassa IP whitelist works behind a proxy. Leave empty when the webhook reaches uvicorn directly. |

### Helper properties

- `payments.enabled` — `true` when both `YOOKASSA_SHOP_ID` and `YOOKASSA_SECRET_KEY`
  are set.
- `payments.mode` — returns `PAYMENT_PROVIDER_MODE`.

### Webhook trust model

Two stacked layers (`src/payment/security.py` + `src/payment/service.py`):

1. **IP whitelist (defense-in-depth).** `is_trusted_yookassa_ip()` accepts only the
   official YooKassa subnetworks. When the request passes a trusted proxy
   (`YOOKASSA_TRUSTED_PROXY_IPS`), `resolve_client_ips()` adds the nearest
   non-trusted hop of `X-Forwarded-For`; a direct request ignores the header, so a
   spoofed `X-Forwarded-For` cannot fool the whitelist.
2. **Authoritative re-verification via the API** (see above) — this is what
   actually decides whether a payment is credited.

`PAYMENT_WEBHOOK_DEV_ACCEPT` (localhost delivery) only takes effect when
`PAYMENT_PROVIDER_MODE=mock`, so a leaked flag in production cannot be used to
enroll a free course from localhost.

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

## Business model (pre-launch)

The platform runs a **"Beta Founders"** program until public release:

- **0% platform commission during beta** — all sale proceeds go to the platform
  (the single YooKassa shop) for product development. Authors are **not** paid
  while the beta is open; manual payouts are introduced after the standard
  monetization model launches.
- **Lifetime Founder status** (`User.is_founder`) is granted automatically to an
  author the moment their course is **published** while the program is open. It
  is recorded permanently so it is unambiguous later who became a Founder.
- **Program window** (configurable via `settings.founder`,
  `src/core/config.py`): the program closes only when **both** the cumulative
  SUCCEEDED revenue reaches `FOUNDER_PROGRAM_REVENUE_LIMIT` (50 000 ₽) **and**
  `FOUNDER_PROGRAM_MAX_AUTHORS` (30 authors) have been granted. Reaching only one
  limit does not close the program; there is no date. The money/author limits
  keep the window from being gamed by empty courses.
- **Founder perks (after release, deferred):** lifetime `FOUNDER_COMMISSION_PERCENT`
  (5% vs. the standard 10%), a recommendation boost in the feed for 12 months,
  a custom sales landing page, no payout minimum for 12 months, and priority
  support. These are not implemented in code yet.

Where it lives:

- `settings.founder` (`FOUNDER_PROGRAM_ENABLED`, `FOUNDER_PROGRAM_REVENUE_LIMIT`,
  `FOUNDER_PROGRAM_MAX_AUTHORS`, `FOUNDER_COMMISSION_PERCENT`).
- `src/founder/service.py` — `grant_founder_if_eligible()`, called on course
  publish (`CourseService.approve_course`) and on AI auto-publish
  (`ai.course_review.task`).
- `User.is_founder` / `founder_at`; `CourseSchema.owner_is_founder` (shown as the
  «Founder» badge next to the author and in the author's profile).

## Limitations & notes

- The YooKassa webhook is not HMAC-signed, so the body is never trusted alone.
  The handler relies on the **IP whitelist** plus the **authenticated
  `GET /v3/payments/{id}` re-verification**, and only advances a row that already
  exists in `pending` state (`provider_payment_id`).
- Behind a reverse proxy, set `YOOKASSA_TRUSTED_PROXY_IPS`; otherwise
  `request.client.host` is the proxy and YooKassa's real IP is lost.
- In a YooKassa test shop the "SBP unavailable" text/code may differ — then the
  fallback won't trigger (hint list is `_SBP_UNAVAILABLE_HINTS`).
- **No author auto-payout.** `PayoutAccount` is stored, but money is never
  transferred to authors in beta; the platform keeps the proceeds.
- `.env` is never committed — secrets (`YOOKASSA_SECRET_KEY`) stay local only.
