# Sign in with Apple (Flutter — parents)

The Flutter app signs in with Sign in with Apple, then exchanges Apple's identity token for a Neyome JWT. Apple requires this endpoint because the app also offers Google sign-in.

**Endpoint:** `POST /auth/login/apple`  
**Auth header:** none (same as `POST /auth/login`)  
**Mobile header:** `x-api-key`

---

## Request

```json
{
  "idToken": "eyJraWQiOi...",
  "name": "Sara Ali",
  "fcmToken": "optional-device-token"
}
```

| Field | Required | Notes |
|-------|----------|--------|
| `idToken` | yes | Identity token from the Apple SDK. Not an authorization code. |
| `name` | no | Send it on the first authorization. Apple gives the name to the app only once, and it is not inside the token. |
| `fcmToken` | no | Stored in `fcmTokens` without duplicates. |

The server checks the signature against `https://appleid.apple.com/auth/keys`, issuer `https://appleid.apple.com`, expiry, and audience.

Set the audience list in the API environment. Use the iOS bundle id. Add the Apple Services ID as well when Android uses Sign in with Apple.

```env
APPLE_CLIENT_IDS=com.example.neyome,com.example.neyome.service
```

Until this variable is set, the endpoint returns **503** `Apple sign-in is not configured`.

---

## Account matching

1. Find a parent by the Apple user id (`sub`).
2. If that is missing, find a parent by the email in the token and link `sub` to that account.
3. If neither exists, create a parent and a family, same as Google sign-in.

The response matches `POST /auth/login`: `{ accessToken, user }`.

Apple may omit the email after the first sign-in. The first request must include an email in the token (the user chooses Share My Email, including Hide My Email). Later sign-ins match `sub` and do not need the email again.

A token whose email belongs to a child account returns **403** `Account not permitted`.
