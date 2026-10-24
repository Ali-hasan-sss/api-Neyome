# Family child device PIN

When a **parent** adds a child via `POST /auth/family-members`, the `pin` field behavior depends on the child's `age`.

Every call below also requires the mobile header `x-api-key: <API_KEY>`.

---

## Co-parent (`isParent: true`)

Same create endpoint as a child, without a PIN. Sign-in is the QR link only (`autoSignInUrl`), not the family-code PIN flow.

The response user and the JWT both include `isParent: true`, so the app opens parent screens. Subscription checkout and auto-renew stay with the family `ownerId` and return **403** for this account.

`GET /auth/family-members` lists children and co-parents. `POST /auth/family-code/members` lists children only.

```http
POST /auth/family-members
x-api-key: <API_KEY>
Authorization: Bearer <parent-jwt>
Content-Type: application/json
```

```json
{
  "name": "Sara",
  "isParent": true
}
```

```json
{
  "success": true,
  "message": "Family member created",
  "data": {
    "user": { "id": "...", "name": "Sara", "isParent": true },
    "autoSignInUrl": "https://api.neyome.com/auth/auto-signin/<token>"
  }
}
```

The app reads the QR, then calls `GET /auth/auto-signin/{token}` with `x-api-key`. The payload `user.isParent` chooses parent screens or child screens.

**HTML reference:** [api-reference.html](http://localhost:3000/api-reference.html)

---

## Age 6 or under (`age ≤ 6`)

| Rule | Detail |
|------|--------|
| PIN format | **Emoji PIN** — exactly **4 characters** (graphemes), e.g. `🌟🎈🐻🎨` |
| Numeric PIN | `1234` is also accepted (4 digits) |
| Required? | Optional (child can use magic link sign-in without PIN) |
| Parent recovery | If `pin` is set, parent can call `GET /auth/family-members/:childId/device-pin` |
| Storage | bcrypt hash + AES-encrypted recoverable copy (`devicePinEnc`) |

### Example — create child with emoji PIN

```http
POST /auth/family-members
x-api-key: <API_KEY>
Authorization: Bearer <parent-jwt>
Content-Type: application/json
```

```json
{
  "name": "Sara",
  "age": 5,
  "pin": "🌟🎈🐻🎨",
  "emojiOption": 3
}
```

### Example — recover PIN (parent only)

```http
GET /auth/family-members/{childId}/device-pin
x-api-key: <API_KEY>
Authorization: Bearer <parent-jwt>
```

```json
{
  "success": true,
  "message": "Device PIN retrieved",
  "data": { "pin": "🌟🎈🐻🎨" }
}
```

---

## Older than 6 (`age > 6`)

| Rule | Detail |
|------|--------|
| PIN format | **4 digits only** (`0`–`9`), e.g. `"1234"` |
| Required? | **Yes** when creating the child |
| Parent recovery | **Not available** (hash only, no plaintext storage) |
| Sign-in | `POST /auth/family-code/child-sign-in` requires correct numeric PIN |

### Example — create child (age 8)

```json
{
  "name": "Omar",
  "age": 8,
  "pin": "4829"
}
```

### Example — child sign-in with family code

```http
POST /auth/family-code/child-sign-in
x-api-key: <API_KEY>
```

```json
{
  "familyCode": "123456",
  "childId": "uuid-of-child",
  "pin": "4829"
}
```

---

## Validation errors

| Case | HTTP | Message (typical) |
|------|------|-------------------|
| Age 8, no PIN | 400 | PIN is required for children older than 6 |
| Age 8, emoji PIN | 400 | PIN must be exactly 4 digits for children older than 6 |
| Age 5, 3 characters | 400 | PIN must be exactly 4 characters (emoji PIN) for children age 6 or under |
| Wrong PIN at sign-in | 401 | Invalid PIN |

---

## Environment

Recoverable PIN encryption uses:

- `DEVICE_PIN_ENCRYPTION_KEY` (recommended), or
- `JWT_SECRET` (minimum 16 characters)

See `.env.example`.
