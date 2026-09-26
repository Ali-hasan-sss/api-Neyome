# App subscription checkout (parents)

The mobile app lets a **parent** pick a plan and a billing period (**month** or **year**), then opens a Stripe Checkout URL.

**Auth:** `Authorization: Bearer <parent JWT>`  
**Swagger:** tag `Billing` at `/docs`

---

## 1. Load prices

`GET /public/subscription-plans`

No auth. Each paid plan includes both amounts:

| Field | Meaning |
|-------|---------|
| `features.backendId` | Send this as `backendPlanId` |
| `monthlyPrice` | Price when `interval` is `month`. `null` means no monthly option |
| `yearlyPrice` | Price when `interval` is `year`. `null` means no yearly option |
| `currency` | ISO code, e.g. `USD` |

Show a monthly/yearly switch only when `yearlyPrice` is greater than 0.

---

## 2. Start checkout

`POST /billing/stripe/checkout-session`

Parent only. The app must send the period the user selected.

### Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `backendPlanId` | string | yes | `features.backendId` from the plan list |
| `interval` | string | yes for a chosen period | `month` or `year` (`monthly` / `yearly` also accepted) |
| `successUrl` | string | no | Opened after payment |
| `cancelUrl` | string | no | Opened if the user cancels |

### Monthly

```http
POST /billing/stripe/checkout-session
Authorization: Bearer <parent-jwt>
Content-Type: application/json

{
  "backendPlanId": "family_pro",
  "interval": "month",
  "successUrl": "https://app.neyome.com/billing/success",
  "cancelUrl": "https://app.neyome.com/billing/cancel"
}
```

### Yearly

```json
{
  "backendPlanId": "family_pro",
  "interval": "year"
}
```

If `interval` is omitted, the server infers it from the id: `_yearly` or `_annual` → year, otherwise month. Send `interval` explicitly after the user picks a period.

### Success — 200

Open `data.url` in the browser or WebView. Do not treat this response as an active subscription; activation happens after Stripe payment via webhook.

```json
{
  "success": true,
  "message": "Stripe checkout session created",
  "data": {
    "url": "https://checkout.stripe.com/c/pay/cs_test_123",
    "sessionId": "cs_test_123"
  }
}
```

The server charges the Stripe price for that interval. Period end is Stripe's `current_period_end` (calendar month or calendar year), not a fixed 30 or 365 days.

### Errors

| Status | When |
|--------|------|
| 400 | Unknown plan, or that interval has no price |
| 401 | Missing or invalid JWT |
| 403 | Caller is not a parent |
| 409 | Family already has an active paid subscription |

---

## 3. Read the active subscription

`GET /billing/stripe/subscription`

Any family member JWT. `billingInterval` is `month` or `year`. `currentPeriodEnd` is the same instant Stripe will renew or end the period.

```json
{
  "success": true,
  "data": {
    "backendId": "family_pro",
    "billingInterval": "year",
    "status": "active",
    "currentPeriodStart": "2026-09-26T10:00:00.000Z",
    "currentPeriodEnd": "2027-09-26T10:00:00.000Z",
    "autoRenew": true,
    "plan": {
      "monthlyPrice": 9.99,
      "yearlyPrice": 99.99,
      "currency": "USD"
    }
  }
}
```

`PATCH /billing/stripe/subscription/auto-renew` with `{ "autoRenew": false }` keeps access until `currentPeriodEnd` and stops the next charge. Parent only.
