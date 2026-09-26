# Google sign-in (Flutter — parents)

The Flutter app signs in with the native Google account picker, then exchanges Google's ID token for a Neyome JWT.

**Endpoint:** `POST /auth/login/google`  
**Auth header:** none (same as `POST /auth/login`)  
**Swagger:** tag `Auth` at `/docs`

This is not a Firebase Auth ID token and not an OAuth redirect on the API. No Firebase service-account JSON is required.

---

## Flow

1. User taps **Sign in with Google**. The native Google account picker appears.
2. The Google SDK returns a signed ID token (JWT). Its audience is the **web client ID**.
3. Flutter posts that raw string to `POST /auth/login/google`.
4. The API verifies the token with `google-auth-library` (Google's public certificates, audience = web client ID).
5. The API finds or creates a parent by the verified **email** (not Google's `sub`), then returns the same `{ accessToken, user }` shape as `POST /auth/login`.

---

## Web client ID (token audience)

```
461238717581-kus9cn1nqgcm7smhoo0kf409t1f3f08s.apps.googleusercontent.com
```

Firebase project: `neyome-350a6`.

Override in `.env` if the client ID changes:

```env
GOOGLE_WEB_CLIENT_ID=461238717581-kus9cn1nqgcm7smhoo0kf409t1f3f08s.apps.googleusercontent.com
```

The value above is the default when the variable is unset.

---

## Request

`POST /auth/login/google`  
`Content-Type: application/json`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `idToken` | string | yes | Signed JWT issued by Google. Verified with the web client ID as audience. |

```json
{
  "idToken": "eyJhbGciOiJSUzI1NiIsImtpZCI6Ii4..."
}
```

---

## Success — 200

Same `data` shape as `POST /auth/login`. Flutter stores `accessToken` and navigates home.

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "8f6a9c0e-4c7a-4c72-8a3d-1b3fc0f0aa11",
      "name": "John Doe",
      "email": "john@example.com",
      "isParent": true,
      "familyId": "2f1a9f4e-1111-2222-3333-aaaaaaaaaaaa",
      "profileImageUrl": "https://lh3.googleusercontent.com/..."
    }
  }
}
```

| Field | Notes |
|-------|--------|
| `data.accessToken` | App JWT, same format as `/auth/login` |
| `data.user` | Same user fields the app already uses |
| `data.user.email` | Unique lookup key. Google's `sub` is not stored |
| `data.user.isParent` | Always `true` for a new Google account |

A new email creates a parent and a family (free plan). An existing parent with that email is signed in. `profileImageUrl` is filled from Google's `picture` when the account has none.

---

## Errors

| Status | When | `message` |
|--------|------|-----------|
| 400 | Missing or empty `idToken` | `idToken is required` |
| 401 | Token invalid, expired, wrong audience, or email missing / not verified | `Invalid Google token` |
| 403 | Email belongs to a non-parent account | `Account not permitted` |
| 500 | Unexpected server error | `Internal server error` |

Envelope: `{ "success": false, "data": null, "message": "..." }`.
