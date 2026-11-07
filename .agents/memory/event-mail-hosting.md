---
name: Event email hosting
description: Why event mail uses a direct provider on Vercel, and how it must relate to booking/payment success.
---

Use direct Resend delivery for the externally hosted event application, with a verified sender domain and deployment-side secrets.

**Why:** The user selected Resend after the Replit-only Gmail connector failed on Vercel with a missing Replit identity error. Connecting a provider inside Replit does not provision credentials on Vercel.

**How to apply:** Do not treat a connected Replit provider or a successful mocked transport test as proof of production mail delivery. Complete sender-domain DNS verification and deployment configuration, then verify delivery separately. Keep organizer notifications independent of attendee confirmations: pending CliQ requests notify the organizer with the receipt; attendee confirmations wait for approval, while verified online payments notify both. Mail failure must never reverse a successful booking or capture.
