# Family child device PIN

When a **parent** adds a child via `POST /auth/family-members`, the `pin` field behavior depends on the child's `age`.

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
