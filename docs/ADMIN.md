# Neyome Admin API & Dashboard

## Overview

- **API base**: `http://localhost:3000` (or `PORT` from `.env`)
- **Admin dashboard**: Next.js app in `admin-dashboard/` (default `http://localhost:3001`)
- **Swagger**: `http://localhost:3000/docs` (Admin routes grouped under **Admin Dashboard**)
- **HTML API reference (English)**: `http://localhost:3000/api-reference.html`
- **Public CMS (no auth)**: see [API-PUBLIC.md](./API-PUBLIC.md) — `/public/support-faqs`, `/public/pages/privacy`, `/public/pages/terms`
- **Auth**: JWT Bearer (`Authorization: Bearer <token>`) for all `/admin/*` routes except login
- **Admin session length**: `ADMIN_JWT_EXPIRES_IN` (default **30 days**), separate from app `JWT_EXPIRES_IN`

## Seed admin & CMS data

Loads CMS-compatible collections from `firebase-export.json` and creates the admin user.

```bash
npm run seed:admin
```

| Variable | Default | Description |
|----------|---------|-------------|
| `ADMIN_EMAIL` | `admin@neyome.com` | Admin login email |
| `ADMIN_PASSWORD` | `Admin123!ChangeMe` | Admin password (change in production) |
| `ADMIN_NAME` | `Neyome Admin` | Display name |

**Seeded collections** (from Firebase export):

| Collection | Count (typical) |
|------------|-----------------|
| `subscription_plans` | 3 |
| `pages` | 3 (privacy, terms, about_us) |
| `support_categories` | 3 |
| `support_faqs` | 5 |
| `support_requests` | 17 |
| `daily_quotes` | 20 |

**Users table:** never bulk-deleted. Only `ADMIN_EMAIL` is created or updated (no duplicate emails). See [SEEDING.md](./SEEDING.md).

Re-running the seed **upserts** CMS rows by primary key (idempotent).

Optional reset before seed (CMS only — **not** users):

```bash
SEED_RESET=true npm run seed:admin
```

**Firebase ID mapping:** Firestore string ids (e.g. `free`, `privacy`) are converted to stable UUIDs via `src/database/stable-id.ts`. Plan `features.backendId` keeps the original Firebase id for billing lookups.

## CORS

Set in API `.env`:

```env
ADMIN_CORS_ORIGINS=http://localhost:3001
```

## Response envelope

All endpoints return:

```json
{
  "success": true,
  "data": {},
  "message": "Human-readable message"
}
```

Errors:

```json
{
  "success": false,
  "data": null,
  "message": "Error description"
}
```

---

## Admin password (dashboard)

Change the **admin dashboard** login password from **Settings** (`/settings` in the admin SPA) or via API:

### `POST /admin/auth/change-password`

**Headers:** `Authorization: Bearer <admin JWT>`

**Body**

| Field | Type | Required |
|-------|------|----------|
| `currentPassword` | string | yes (min 8) |
| `newPassword` | string | yes (min 8) |

---

## Admin Auth

### `POST /admin/auth/login`

**Public** — no Bearer token.

**Token lifetime:** controlled by `ADMIN_JWT_EXPIRES_IN` (default `30d`). After changing `.env`, restart the API and sign in again to get a new token.

**Body**

| Field | Type | Required | Rules |
|-------|------|----------|-------|
| `email` | string | yes | Valid email |
| `password` | string | yes | Min 8 characters |

**Example**

```json
{
  "email": "admin@neyome.com",
  "password": "Admin123!ChangeMe"
}
```

**Response `data`**

| Field | Type | Description |
|-------|------|-------------|
| `accessToken` | string | JWT (7d default) |
| `user` | object | Admin profile (no password) |

---

### `GET /admin/auth/me`

**Headers**: `Authorization: Bearer <token>`  
**Requires**: `isAdmin: true` in JWT

**Response `data`**: Admin user record.

---

## Admin Navigation

### `GET /admin/links`

Returns dashboard routes and matching API bases for the SPA sidebar.

**Response `data.sections[]`**

| Field | Description |
|-------|-------------|
| `key` | Stable id |
| `title` / `titleAr` | EN / AR labels |
| `dashboardPath` | Next.js path (e.g. `/plans`) |
| `apiBase` | API path prefix |
| `methods` | Allowed HTTP methods |

---

## Admin Users

All require **Admin JWT**.

### `GET /admin/users`

**Query**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `page` | number | no | Default `1` |
| `limit` | number | no | Default `20` |
| `sortBy` | string | no | Column name |
| `sortOrder` | `ASC` \| `DESC` | no | |
| `search` | string | no | Search **name or email** across all pages (`ILIKE`, OR) |

**App user email change** (not admin): `POST /auth/change-email/request` and `POST /auth/change-email/verify` — see [AUTH-EMAIL-CHANGE.md](./AUTH-EMAIL-CHANGE.md) and [api-reference.html](http://localhost:3000/api-reference.html).
| `name` | string | no | `ILIKE %name%` (ignored if `search` is set) |
| `email` | string | no | `ILIKE %email%` (ignored if `search` is set) |

**Response `data`**: `{ items: User[], total, page, limit }`

### `GET /admin/users/:id`

`:id` — user UUID.

### `PATCH /admin/users/:id`

**Body** (all optional): `name`, `email`, `isParent`, `points`, `locale`, `profileImageUrl`, `emojiOption`, `age`, …

### `DELETE /admin/users/:id`

Soft-deletes the user.

---

## Admin Subscription Plans

### `GET /admin/subscription-plans`

Pagination query: `page`, `limit`, `sortBy`, `sortOrder`.

### `GET /admin/subscription-plans/:id`

`:id` — plan id (e.g. `free`, `family_pro_monthly`).

### `POST /admin/subscription-plans`

**Body**

| Field | Type | Required |
|-------|------|----------|
| `id` | string | yes |
| `title` | object | no |
| `subtitle` | object | no |
| `periodShort` | object | no |
| `badge` | object | no |
| `features` | object | no |
| `productId` | string \| null | no |
| `sort` | number | no |
| `limitsVersion` | number | no |
| `limits` | object | no |

### `PATCH /admin/subscription-plans/:id`

Partial update — same fields as POST (all optional).

### `DELETE /admin/subscription-plans/:id`

Soft delete.

---

## Admin Pages (Privacy, Terms, CMS)

### `GET /admin/pages`

**Query**: pagination + optional `type` (`privacy`, `terms`, …).

### `GET /admin/pages/type/:type`

Fetch single page by `type` (e.g. `privacy`).

### `GET /admin/pages/:id`

`:id` — page id (e.g. `privacy`, `terms`, `about_us`).

### `POST /admin/pages`

| Field | Type | Required |
|-------|------|----------|
| `id` | string | yes |
| `type` | string | no |
| `version` | string | no |
| `locales` | object | no |
| `content` | object | no |
| `cards` | object | no |
| `updatedAt` | ISO date string | no |

### `PATCH /admin/pages/:id`

Partial update.

### `DELETE /admin/pages/:id`

Soft delete.

**Privacy / Terms content shape** (from Firebase):

```json
{
  "locales": {
    "en": { "title": "Privacy Policy", "body": "..." },
    "ar": { "title": "...", "body": "..." },
    "de": { "title": "...", "body": "..." }
  },
  "type": "privacy",
  "version": "2025-09-24"
}
```

---

## Admin Support FAQs

### `GET /admin/support-faqs` — paginated list

### `GET /admin/support-faqs/:id`

### `POST /admin/support-faqs`

| Field | Type | Required |
|-------|------|----------|
| `id` | string | yes |
| `question` | object (i18n) | no |
| `answer` | object (i18n) | no |

### `PATCH /admin/support-faqs/:id`

### `DELETE /admin/support-faqs/:id`

---

## Admin Support Categories

### `GET /admin/support-categories`

### `POST /admin/support-categories`

| Field | Required |
|-------|----------|
| `id` | yes |
| `name_en`, `name_ar`, `name_de` | no |

### `PATCH /admin/support-categories/:id`

### `DELETE /admin/support-categories/:id`

---

## Admin Support Requests

### `GET /admin/support-requests` — paginated

### `PATCH /admin/support-requests/:id`

Optional: `name`, `message`, `email`, `categoryId`, `categoryName`, `attachmentUrl`.

### `DELETE /admin/support-requests/:id`

---

## Admin Daily Quotes

### `GET /admin/daily-quotes`

### `POST /admin/daily-quotes`

| Field | Type | Required |
|-------|------|----------|
| `id` | string | yes |
| `text` | string | no |
| `createdAt` | ISO date | no |

### `PATCH /admin/daily-quotes/:id`

### `DELETE /admin/daily-quotes/:id`

---

## Dashboard (Next.js)

```bash
cd admin-dashboard
cp .env.local.example .env.local
npm install
npm run dev
```

| Env | Description |
|-----|-------------|
| `NEXT_PUBLIC_API_URL` | API origin (e.g. `http://localhost:3000`) |

Default login after seed: credentials from `ADMIN_EMAIL` / `ADMIN_PASSWORD`.
