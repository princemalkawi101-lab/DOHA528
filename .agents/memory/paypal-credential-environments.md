---
name: PayPal credential environments
description: PayPal OAuth credentials must match the configured API environment.
---

Use a Client ID and Secret from the same PayPal REST app and the same environment. Live credentials require the Live API endpoint; Sandbox credentials require the Sandbox endpoint. Keep `PAYPAL_ENVIRONMENT` explicit when diagnosing authentication failures.

**Why:** PayPal returns a generic `invalid_client`/401 when credentials are invalid, mismatched, or sent to the wrong environment, so a successful secret upload alone does not prove the payment setup is usable.

**How to apply:** When OAuth returns 401, check the environment pairing and the PayPal app credentials in the provider dashboard before changing checkout or capture logic. Never log the credential values.