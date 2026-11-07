---
name: Event email hosting
description: Why event mail uses a direct provider on Vercel, and how it must relate to booking/payment success.
---

Use direct Resend delivery for the externally hosted event application, with a verified sender domain and deployment-side secrets.

**Why:** The user selected Resend after the Replit-only Gmail connector failed on Vercel with a missing Replit identity error. Connecting a provider inside Replit does not provision credentials on Vercel.

**How to apply:** Do not treat a connected Replit provider or a successful mocked transport test as proof of production mail delivery. Complete sender-domain DNS verification and deployment configuration, then verify delivery separately. Keep organizer notifications independent of attendee confirmations: pending CliQ requests notify the organizer with the receipt; attendee confirmations wait for approval, while verified online payments notify both. Mail failure must never reverse a successful booking or capture.

The workshop WhatsApp invitation is restricted to approved in-person attendees, and its invitation wording and button must be editable by administrators. Do not include WhatsApp in online attendee emails.

**Why:** The user clarified that WhatsApp is for in-person attendance only, after the administrator verifies the receipt, not available from public landing-page settings.

**How to apply:** Store invitation settings outside visitor-readable configuration; only admin-authenticated server actions may read or change them. Add the invitation only to future approved in-person confirmation emails, never online, pending-request or organizer notices. Changing settings must not automatically resend past confirmations.

Keep ordinary online workshop access and VIP Telegram access separate.

**Why:** The user supplied different Telegram invitations for the online ticket and the VIP upgrade. Paying for the ordinary online ticket must not grant VIP access.

**How to apply:** Unlock the online invitation only after a verified online base-ticket payment, and unlock the separate VIP invitation only after a verified VIP upgrade. An online attendee who upgrades retains access to both. Keep invitation values out of memory and public configuration.
