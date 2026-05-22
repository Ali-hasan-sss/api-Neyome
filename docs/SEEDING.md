# Admin seed (`npm run seed:admin`)

## Users table — safe behavior

| Action | Behavior |
|--------|----------|
| Delete all users | **Never** — the seed script does not truncate or bulk-delete `users` |
| Duplicate users | **Never** — only one admin row is touched, matched by `ADMIN_EMAIL` |
| Existing app users | **Preserved** — parents, children, and other accounts are unchanged |
| Admin account | **Create or update** — if `ADMIN_EMAIL` exists → update password, `isAdmin`, name; else create one admin user |

## CMS tables (plans, pages, FAQs, …)

| `SEED_RESET` | Behavior |
|--------------|----------|
| unset / `false` | **Upsert** by primary key (`id`) — re-running seed updates rows from `firebase-export.json`, does not create duplicate IDs |
| `true` | **Delete all CMS rows** in seeded tables, then insert from export. **Users table still untouched.** |

## Environment

```env
ADMIN_EMAIL=admin@neyome.com
ADMIN_PASSWORD=Admin123!ChangeMe
ADMIN_NAME=Neyome Admin
SEED_RESET=true   # optional — only when you want a full CMS refresh
```

## Files

- `firebase-export.json` in project root (required)
- Script: `src/scripts/seed-admin.ts` → `AdminSeedService`
