---
name: Legacy administrator verification
description: Prevents locking out the established Firebase administrator while migrating to custom claims.
---

Keep the exact legacy administrator fallback working without requiring Firebase's `email_verified` token flag until the account has a trusted `admin: true` custom claim.

**Why:** The established administrator account currently authenticates successfully but its Firebase token is not marked as email-verified. Requiring that flag hid the admin navigation and denied the dashboard.

**How to apply:** Prefer the custom claim when present. During the migration period, retain the narrowly scoped legacy fallback in both the client role check and Firestore rules; remove it only after confirming the claim is provisioned and a fresh token recognizes it.