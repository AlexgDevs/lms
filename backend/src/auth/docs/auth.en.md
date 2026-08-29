# Auth module

> Location: `backend/src/auth/`
> Imports: `user`, `core` (`config`, `services`, `repositories`, `unit_of_work`,
> `mappers`, `schemas`, `errors`, `events`, `mailer`).

The `auth` module owns **identification, authentication and account security**:
registration, login, token issuance and rotation, sessions, password reset, and
email verification. It is the entry point for the whole platform — every other
feature depends on the access token issued here.

---

## Architecture

The module follows the project's layering:

```
router → service → repository / unit_of_work → mapper → schemas → models
                    └── security.py (JWT + Argon2)
                    └── device_parser.py (User-Agent → device name)
```

| File | Responsibility |
| --- | --- |
| `router.py` | Thin FastAPI routes for the `/auth` prefix (public + session endpoints). |
| `services.py` | Business logic: `AuthService`. Registration, login, refresh, logout, sessions, password reset, email verification. |
| `security.py` | JWT encode/decode (access, reset, verification), Argon2 password hashing, opaque refresh-token generation + hashing. |
| `schemas.py` | Pydantic v2 request/response schemas (`BaseSchema`). |
| `models.py` | ORM model `RefreshToken`. |
| `repository.py` | `RefreshTokenRepository` (lookup, revoke, session queries). |
| `unit_of_work.py` | `AuthUnitOfWork` — composes `users` + `refresh_tokens` repositories. |
| `mapper.py` | `AuthMapper` — `RefreshToken` ⇄ `RefreshTokenSchema`. |
| `exceptions.py` | `AuthorizationError` hierarchy (401). |
| `dependencies.py` | DI wiring: `AuthServiceDep`, `AuthUnitOfWorkDep`, `RefreshTokenRepositoryDep`. |
| `device_parser.py` | Parses a `User-Agent` into a human-readable device name ("Chrome on Windows"). |
| `utils.py` | `set_tokens_cookie` — writes http-only auth cookies (used by cookie-based clients). |

> The module uses `UserRepository` (from `user`) for user records; the `User`
> model itself belongs to the `user` module.

---

## Tokens

Three kinds of tokens are used, all signed with the same `JWT_SECRET_KEY` /
`JWT_ALGORITHM` but distinguished by their purpose and payload.

| Token | Type | Payload | TTL | Used for |
| --- | --- | --- | --- | --- |
| Access token | JWT (opaque `type` field is **absent**) | `{sub: user_id, exp}` | `ACCESS_TOKEN_EXPIRE_MINUTES` (default **15 min**) | Bearer auth on every protected request |
| Refresh token | Opaque random string (`secrets.token_urlsafe(48)`) | — (stored only as SHA-256 hash) | `REFRESH_TOKEN_EXPIRE_DAYS` (default **7 d**) | Rotated on `/auth/refresh`; identifies sessions |
| Reset token | JWT | `{sub: user_id, type: "reset", exp}` | **15 min** | `POST /auth/reset-password` |
| Verification token | JWT | `{sub: user_id, type: "verify", exp}` | **24 h** | `POST /auth/verify-email` |

Key points:

- **Access tokens are short-lived** and stateless; they are not stored in the DB.
- **Refresh tokens are opaque and only ever stored as a SHA-256 hash**
  (`security.hash_refresh_token`). The raw raw token is returned to the client
  but never persisted server-side.
- **Reset & verification tokens** carry a `type` claim; the decoder rejects any
  JWT whose `type` does not match the expected value.

Settings live in `src/core/config.py` (`settings.app`):

| Setting | Default | Meaning |
| --- | --- | --- |
| `JWT_SECRET_KEY` | (required) | HMAC secret for JWT signing |
| `JWT_ALGORITHM` | `HS256` | JWT signing algorithm |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `15` | Access-token TTL |
| `REFRESH_TOKEN_EXPIRE_DAYS` | `7` | Refresh-token TTL |
| `FRONTEND_HOST` | `http://localhost:3000` | Used to build verification/reset email links |

### Mail (SMTP) settings

Emails are sent via SMTP (`aiosmtplib`). All of these live in
`settings.mail`:

| Setting | Default | Meaning |
| --- | --- | --- |
| `MAIL_ENABLED` | `True` | Master switch. When `False`, emails are **only logged** (never sent) — useful in dev. |
| `SMTP_HOST` | `localhost` | SMTP server host. |
| `SMTP_PORT` | `1025` | SMTP server port. |
| `SMTP_USERNAME` | `None` | SMTP login (optional). |
| `SMTP_PASSWORD` | `None` | SMTP password (optional). |
| `SMTP_FROM` | `noreply@lms.local` | From address. |
| `SMTP_FROM_NAME` | `LMS` | Display name for the From header. |
| `SMTP_USE_TLS` | `False` | Use TLS when connecting to the SMTP server. |
| `SMTP_TIMEOUT_SECONDS` | `10.0` | Connection timeout. |

Email sending is **fail-soft**: a misconfigured or unreachable SMTP server never
breaks the auth flow — the error is logged (see `src/core/mailer/mailer.py`).

### Testing email locally

The repo ships a [Mailpit](https://mailpit.axllent.org/) container as a local
SMTP sink (`docker-compose.yaml`). The backend already points at it by default
(`SMTP_HOST=localhost`, `SMTP_PORT=1025`, `MAIL_ENABLED=true`), so no `.env`
change is required.

1. Start it:

   ```bash
   docker compose up -d mailpit
   ```

   - SMTP: `localhost:1025`
   - Inbox web UI: `http://localhost:8025`

2. Trigger a flow that sends a message, e.g. register:

   ```bash
   curl -X POST http://localhost:8000/api/v1/auth/register \
     -H "Content-Type: application/json" \
     -d '{"username":"demo","email":"demo@example.com","password":"password123"}'
   ```

3. Open `http://localhost:8025` — the verification / reset email is there with a
   link `{FRONTEND_HOST}/verify-email?token=...`.

4. Either browse the link with the frontend running, or grab the `token` and call
   the endpoint directly: `POST /api/v1/auth/verify-email`.

For `forgot-password` the flow is identical and produces a 15-minute reset token.

Alternatives:

- `MAIL_ENABLED=false` → no SMTP at all; emails are **only logged**
  (`"Mail disabled; would send ..."`) — handy but you won't get a clickable link.
- A real transactional provider (Mailtrap, Brevo, …): set `SMTP_HOST` / `SMTP_PORT`,
  `SMTP_USERNAME`, `SMTP_PASSWORD`, `SMTP_USE_TLS=true` in `.env`.

---

## Endpoints

Base path: `/api/v1/auth`. All responses use the shared error shape `{error, detail}`.

### Registration & login (public)

| Method | Path | Body | Success | Notes |
| --- | --- | --- | --- | --- |
| `POST` | `/register` | `UserRegisterSchema {username, email, password}` | `201` `UserPublicSchema` + `Location` header | Creates the user (`is_verified=False`) and queues a verification email. |
| `POST` | `/login` | OAuth2 form: `username`, `password` | `200` `TokenPair` | Returns `{access_token, refresh_token, token_type}`. Also captures `ip_address` + `user_agent`. |

> `register` returns `UserPublicSchema` (no `email`, no `password_hash`) — public
> PII is reduced by design.

### Tokens & logout (mixed)

| Method | Path | Body | Auth | Success |
| --- | --- | --- | --- | --- |
| `POST` | `/refresh` | `{refresh_token}` | none | `200` `TokenPair` (new pair, previous refresh token revoked) |
| `POST` | `/logout` | `{refresh_token}` | access token | `204` — revokes the refresh token |

### Sessions (requires access token; auth-only — does **not** require email verification)

| Method | Path | Query | Success | Notes |
| --- | --- | --- | --- | --- |
| `GET` | `/sessions` | `current_token` (current refresh token) | `200` `list[SessionSchema]` | Active sessions, newest first; marks the current one with `is_current`. |
| `DELETE` | `/sessions/{session_id}` | — | `204` | Revoke one session. |
| `DELETE` | `/sessions` | `current_token` | `204` | Revoke all **other** sessions (keeps the current one). |

### Password & email (public)

| Method | Path | Body | Success |
| --- | --- | --- | --- |
| `POST` | `/forgot-password` | `{email}` | `200` `ForgotPasswordResponseSchema` — always the same message; does not reveal whether the email exists |
| `POST` | `/reset-password` | `{token, new_password}` | `200` `{message}` |
| `POST` | `/verify-email` | `{token}` | `200` `MessageResponseSchema` |
| `POST` | `/resend-verification` | `{email}` | `200` `MessageResponseSchema` — sends only if the user exists and is not yet verified |

---

## Flows

### 1. Registration + email verification

1. `POST /auth/register` → `AuthService.register` (services.py):
   - hashes the password with **Argon2** (`security.hash_password`);
   - creates a `User` with `is_verified=False`;
   - sends a verification email (`send_verification_email`) pointing at
     `{FRONTEND_HOST}/verify-email?token=...`.
2. User opens the link → `POST /auth/verify-email` → `AuthService.verify_email`:
   - `decode_verification_token` → requires JWT `type == "verify"`;
   - sets `is_verified=True` and `email_verified_at=now` (idempotent).
3. Once verified, the user is granted full access (see **Email-verification gating**).

Email sending is **fail-soft**: if `MAIL_ENABLED` is off or the SMTP call throws,
the error is logged and the flow continues — registration is never blocked by a
misconfigured mail server.

### 2. Login → token pair

`AuthService.login` verifies the password, determines the device name from the
`User-Agent`, creates a `RefreshToken` row (only its hash is stored, plus
`ip_address` / `user_agent` / `device_name`), and returns `TokenPair`.

### 3. Refresh (with rotation)

`POST /auth/refresh` accepts a refresh token; the service:

1. looks the raw token up by its **hash**;
2. rejects expired or revoked tokens;
3. **if the token was already revoked → treats it as reuse** (possible token
   theft) and revokes **all** of that user's refresh tokens;
4. otherwise revokes the presented token (rotation) and issues a fresh `TokenPair`.

### 4. Sessions

Refresh-token rows double as **sessions**. `GET /auth/sessions` lists non-revoked,
non-expired tokens, newest first; the client passes its current refresh token via
`current_token` so the UI can mark it as `is_current`. `DELETE /sessions/{id}`
revokes one; `DELETE /sessions` revokes all except the current one.

### 5. Password reset

1. `POST /auth/forgot-password` → if a user with that email exists, sends a
   reset link (`{FRONTEND_HOST}/reset-password?token=...`). The response is
   identical regardless of email existence (no account enumeration).
2. `POST /auth/reset-password` → `decode_reset_token` (requires `type == "reset"`,
   15-min TTL) → updates the stored password hash.

---

## Email-verification gating

Email verification is a **real** restriction, enforced centrally in
`src/user/dependencies.py` via `get_current_user_id` (which feeds `UserIdDep`,
`CurrentUserDep` and `StaffDep`). Any protected endpoint raises
`UserNotVerifiedError` (`403`, detail `"Email not verified"`) until the user has
`is_verified=True`.

Dependency matrix:

| Dependency | Requires access token | Requires email verification | Used by |
| --- | --- | --- | --- |
| `AuthenticatedUserIdDep` / `AuthenticatedCurrentUserDep` | ✅ | ❌ | **auth-only**: `/users/me`, `/users/{id}`, password, sessions, logout, notifications, media, own payments/certificates/profile stats |
| `UserIdDep` / `CurrentUserDep` / `StaffDep` | ✅ | ✅ | **verified-required**: course/module/lesson/block CRUD, submissions, enroll, AI-generation, TGP, reviews, payments checkout, moderation |
| `OptionalUserIdDep` | optional | n/a | **public**: anonymous reads (course catalog, course detail) |

Practical consequence for an unverified user:

- ✅ can register, log in, verify email, manage their account (profile, settings,
  avatar, password, sessions, notifications, own purchases/certificates);
- ✅ can browse the public catalog and read published course pages;
- ❌ cannot create / publish / manage content, enrol, submit, generate AI content,
  pay for a course, or write reviews — these return `403 UserNotVerifiedError`.

A `403` with error `"UserNotVerifiedError"` is handled on the frontend by
redirecting to `/verify-email`.

---

## Security notes

- **Passwords**: Argon2 via `pwdlib` (never stored in plain text).
- **Refresh tokens**: opaque + SHA-256-hashed in the DB; raw value exists only on
  the client; rotation on every use; reuse detection revokes all sessions.
- **Session metadata**: each refresh token records `ip_address`, `user_agent` and
  a parsed `device_name` for the sessions UI.
- **No account enumeration**: forgot-password and resend-verification always
  return the same message.
- **Cookies**: `set_tokens_cookie` (utils.py) sets http-only, `SameSite=Lax`
  cookies; `secure` follows `settings.app.secure_cookies`. The refresh cookie is
  scoped to `/api/v1/auth/refresh`.
- **Fail-soft email**: mail failures are logged, never raised into the auth flow.

---

## Errors

All auth errors inherit `AuthorizationError` → `AppException` (HTTP `401`), and
are rendered by the global handler as `{error, detail}`:

| Exception | Detail |
| --- | --- |
| `IncorrectPasswordError` | `"Incorrect password"` |
| `InvalidAccessTokenError` | `"Invalid access token"` |
| `InvalidRefreshTokenError` | `"Invalid refresh token"` |
| `NoRefreshTokenError` | `"No refresh token"` |

Related errors from other modules:

| Exception | Where | HTTP |
| --- | --- | --- |
| `UserNotFoundError` | `user` | 404 |
| `UserAlreadyExistsError` | `user` | 409 |
| `UserNotVerifiedError` | `user` | 403 |

---

## Related files

- `src/core/dependencies.py` — `AccessTokenDep` (oauth2 bearer), `SessionDep`,
  `EventBusDep`.
- `src/core/mailer/mailer.py` — `send_verification_email`, `send_password_reset_email`.
- `src/user/dependencies.py` — `UserIdDep`, `AuthenticatedUserIdDep`,
  `CurrentUserDep`, `StaffDep`, `OptionalUserIdDep`; verification gate.
- `src/core/config.py` — `settings.app` (JWT/TTL/host) and `settings.mail`.
