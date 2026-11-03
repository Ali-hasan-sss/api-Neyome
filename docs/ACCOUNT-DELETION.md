# Account and family deletion

Apple and Google Play require an in-app way to delete an account. Both routes need `Authorization: Bearer` and, from the mobile app, `x-api-key`.

## `DELETE /users/me`

Deletes the signed-in account.

- **Family owner:** also deletes the family. Every member, task, reward, reward list, claimed reward, point ledger row, badge, task type, streak, and setting for that family is removed. The Stripe subscription is cancelled when one exists. Response `data.scope` is `family`.
- **Child or co-parent:** deletes only that account, plus their tasks, rewards, claims, points, streak, and settings. The family stays. Response `data.scope` is `account`.

Email, name, PIN, profile image, and notification tokens are cleared.

## `DELETE /families/my-family`

Same family wipe as the owner path above. **Only the family owner** can call it. A co-parent receives **403**.

A public request page for people who cannot open the app is on the marketing site: `/ar/delete-account` (also `/en` and `/de`).
