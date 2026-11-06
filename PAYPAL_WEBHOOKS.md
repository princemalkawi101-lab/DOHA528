# Event payment recovery

Both the Replit API and root Vercel function accept **POST `/api/event-webhook`**.
This endpoint uses PayPal signature verification, not Firebase authentication.
The authenticated `/api/event` capture/retry path remains available.

## Provider setup

1. In the existing PayPal REST app, register the site's externally reachable
   HTTPS `/api/event-webhook` URL for `PAYMENT.CAPTURE.COMPLETED`.
2. Set `PAYPAL_WEBHOOK_ID` on the API host to the ID assigned to that webhook.
   This is a webhook registration ID, **not** a client ID or secret.
3. Keep the webhook registration, `PAYPAL_CLIENT_ID`, `PAYPAL_SECRET`, and
   `PAYPAL_ENVIRONMENT` in the same PayPal REST app/environment. Configure these
   on both hosts if both hosts receive deliveries. Sandbox and Live use
   different webhook IDs. No provider settings are changed by this code.

Without the webhook ID, delivery fails closed with HTTP 503; it never grants
access. Do not use a mock PayPal simulator signature as proof of a real payment.

## Reconciliation and operations

- A completed capture must match a server-created event order, the provider's
  current completed capture ID, USD currency, and the fixed price: **$30 online**
  or **$49 VIP upgrade**. Client-supplied amounts cannot set a price.
- Webhooks only read PayPal payment state; they do not initiate charges.
- Duplicate notifications and concurrent browser callbacks commit one atomic
  Firestore update. Event closure does not block already-paid recovery.
- VIP membership is independent of CliQ approval: a VIP upgrade does not approve
  a pending receipt or reverse an administrator's review.
- Non-completion events and orders outside event checkout are acknowledged and
  ignored. Refunds and reversals do not automatically revoke access.
- HTTP 401 means signature verification failed; HTTP 400 means malformed input.
  HTTP 409 means a payment mismatch or booking conflict requiring investigation.
  HTTP 503 means setup or a temporary provider/database failure; retry delivery
  after resolving it. A conflict is not acknowledged as successful recovery.
- If a separate CliQ booking, another owner's booking, or another paid VIP
  upgrade conflicts, the webhook does not overwrite it or mark the order
  captured. Match the provider capture to `eventPaymentOrders` and
  `eventRegistrations`, resolve the conflict deliberately, and redeliver the
  event or use the existing authenticated capture retry. Do not pay again.
- This recovery does not send confirmation emails automatically; existing
  administrator review and email retry remain unchanged.

## Safe tests

`pnpm test:paypal-webhook` replaces all network calls with offline responses.
`pnpm test:firestore-rules` runs booking/reconciliation tests only against the
Firestore emulator, with fake PayPal and email providers. Neither command
creates a provider order, charges an account, or writes to the live database.
