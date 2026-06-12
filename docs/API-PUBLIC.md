# Public API (no authentication)

These endpoints do **not** require `x-api-key` or JWT. Use them from mobile/web clients for read-only CMS content.

**Base URL:** `http://localhost:3000` (or your deployment host)

**HTML reference (English):** [/api-reference.html](http://localhost:3000/api-reference.html)

---

## Language / locale headers

All **`/public/*`** CMS responses return **localized strings** (not full `en`/`ar`/`de` maps).

| Header | Priority | Example |
|--------|----------|---------|
| `X-Locale` | **1** (preferred) | `X-Locale: ar` |
| `Accept-Language` | 2 | `Accept-Language: ar-SA,ar;q=0.9,en;q=0.8` |

**Supported locales:** `en`, `ar`, `de`  
**Fallback order:** requested locale → `en` → first available translation

The resolved locale is echoed in `data.locale` (and each FAQ item includes `locale`).

---

## FAQs

### `GET /public/support-faqs`

Paginated list of support FAQs in one language.

**Query:** `page` (default 1), `limit` (default 50)

**Example (Arabic)**

```http
GET /public/support-faqs?page=1&limit=50
X-Locale: ar
```

**Response**

```json
{
  "success": true,
  "message": "FAQs fetched",
  "data": {
    "locale": "ar",
    "items": [
      {
        "id": "...",
        "locale": "ar",
        "question": "هل يمكنني إرفاق ملفات في رسائل الدعم؟",
        "answer": "نعم، يمكنك إرفاق ملفات PDF أو صور في طلب الدعم."
      }
    ],
    "total": 5,
    "page": 1,
    "limit": 50
  }
}
```

---

## Subscription Plans

### `GET /public/subscription-plans`

Paginated list of all available subscription plans with pricing and features.

**Query:** `page` (default 1), `limit` (default 50)

**Example**

```http
GET /public/subscription-plans?page=1&limit=50
```

**Response**

```json
{
  "success": true,
  "message": "Subscription plans fetched",
  "data": {
    "items": [
      {
        "id": "...",
        "title": { "en": "Free", "ar": "مجاني", "de": "Free" },
        "price": 0,
        "currency": "USD",
        "periodShort": { "en": "month", "ar": "شهر", "de": "Monat" },
        "features": {
          "backendId": "free",
          "en": ["Up to 3 family members", "Basic tasks"],
          "ar": ["حتى 3 أفراد", "مهام أساسية"]
        },
        "limits": {
          "members": 4,
          "tasksPerDay": 10,
          "rewardsPerDay": 10
        },
        "sort": 0
      }
    ],
    "total": 3,
    "page": 1,
    "limit": 50
  }
}
```

---

## Legal pages

### `GET /public/pages/privacy`

Privacy policy (`type: privacy`), localized `title` + `body`.

### `GET /public/pages/terms`

Terms of use (`type: terms`), localized `title` + `body`.

### `GET /public/pages/:type`

Any CMS page by `type` field.

**Example (German)**

```http
GET /public/pages/privacy
Accept-Language: de
```

**Response**

```json
{
  "success": true,
  "message": "Privacy policy fetched",
  "data": {
    "id": "...",
    "type": "privacy",
    "version": "2025-09-24",
    "locale": "de",
    "title": "Datenschutzerklärung",
    "body": "Dies ist die Datenschutzerklärung (DE)..."
  }
}
```

---

## Related (API key required)

Legacy routes return **raw JSONB** (all languages). Prefer **`/public/*`** for localized client responses:

| Route | Auth | Localized |
|-------|------|-----------|
| `GET /public/support-faqs` | none | yes |
| `GET /public/pages/privacy` | none | yes |
| `GET /public/subscription-plans` | none | yes |
| `GET /support-faqs` | `x-api-key` | no (full maps) |
| `GET /pages`, `GET /pages/:id` | `x-api-key` | no |
| `GET /subscription-plans` | `x-api-key` | no |
