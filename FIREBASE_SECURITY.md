# Firestore security

The repository's Firestore policy is defined in `firestore.rules` and registered
in `firebase.json`.

## Administrator identity

Writes to site content and settings require an authenticated Firebase user whose
ID token contains the custom claim `admin: true`. For continuity, the existing
`admin@dohahealing.com` account is also accepted only when Firebase marks its
email as verified.

Provision the custom claim from a trusted server or Firebase Admin SDK, then have
the administrator sign out and back in so Firebase issues a fresh ID token.
Never set administrator claims from browser code.

## Deployment

From an authenticated Firebase CLI, deploy only these rules:

```sh
pnpm dlx firebase-tools deploy --only firestore:rules --project "$VITE_FIREBASE_PROJECT_ID"
```

The Firebase project is intentionally not hard-coded in `.firebaserc`; the
environment-specific project ID must be supplied explicitly to prevent an
accidental deployment to the wrong project.

## Policy summary

- `siteSettings/config`, catalog content, advertisements, reviews, and slider
  settings are publicly readable and writable only by an administrator.
- Social links are limited to 5 entries. Every entry must use a supported
  platform, contain only the expected fields, use an HTTPS destination, and
  provide valid ordering and activation values.
- A social-link write must increment `socialLinksRevision` by exactly one in the
  same transaction. This preserves the optimistic-concurrency transaction used
  by the admin screen.
- Public users may create pending bookings and purchases. They cannot read
  bookings; authenticated users may read only purchases belonging to their UID.
  Administrative management remains available.
- Every unlisted collection and document is denied by default.