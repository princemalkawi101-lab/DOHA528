---
name: Event price transitions
description: Preserve already-issued PayPal payments when event prices change temporarily or are restored.
---

Validate PayPal payments against their original server-issued pricing version, not only the price currently displayed.

**Why:** The user temporarily lowers event prices to test real payments, then restores normal prices. Previously issued orders must remain recoverable across that transition, and cached checkout sessions must not charge an outdated amount for a new purchase.

**How to apply:** Keep historical server-owned price versions, invalidate checkout reuse when the price/version changes, and display the actual recorded amount in admin views and notification emails. Never trust a browser-supplied price or change amounts on already-issued orders.
