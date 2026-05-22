# Change email API (app users — parents)

Parents with email/password accounts can change their login email using a two-step OTP flow. The verification code is sent to the **new** email address.

**Authentication:** `Authorization: Bearer <JWT>` (parent user, not admin).

---

## 1. Request verification code

`POST /auth/change-email/request`

### Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `newEmail` | string (email) | yes | New email address |

### Example

```json
{
  "newEmail": "newparent@example.com"
}
```

### Response

```json
{
  "success": true,
  "message": "Verification code sent to your new email",
  "data": {
    "expiresInMinutes": 10
  }
}
```

### Errors

| Status | Reason |
|--------|--------|
| 400 | Same as current email, or not a parent account |
| 409 | Email already registered |
| 401 | Missing/invalid JWT |

**SMTP:** Configure `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` in `.env` (same as password reset).

---

## 2. Verify code and apply new email

`POST /auth/change-email/verify`

### Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `newEmail` | string (email) | yes | Must match the email from step 1 |
| `otp` | string | yes | 6-digit code from email |

### Example

```json
{
  "newEmail": "newparent@example.com",
  "otp": "482913"
}
```

### Response

```json
{
  "success": true,
  "message": "Email updated successfully",
  "data": {
    "user": { "id": "...", "email": "newparent@example.com", "..." },
    "accessToken": "eyJhbG..."
  }
}
```

Replace the stored JWT in the app with `accessToken` (email claim is updated).

### Errors

| Status | Reason |
|--------|--------|
| 400 | Invalid/expired OTP, or no pending request for this email |
| 409 | Email taken by another user |

---

## Admin password (dashboard only)

`POST /admin/auth/change-password` — see [ADMIN.md](./ADMIN.md).

Used only from the admin dashboard **Settings** page (`/settings`), with admin JWT.
