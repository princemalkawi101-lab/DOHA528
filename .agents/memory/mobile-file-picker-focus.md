---
name: Mobile file-picker focus refresh
description: Preserve receipt file inputs across focus-triggered registration refreshes.
---

Refresh registration status in the background when the window regains focus; do not replace the booking form with a loading screen.

**Why:** Android file pickers return focus to the page before file selection has necessarily reached the input. A loading refresh can unmount that input and lose the selected receipt. The same focus behavior applies to payment popups.

**How to apply:** Keep upload inputs mounted during focus refresh, retain selected files on cancellation, and show a local preview distinguishing selection from server submission. Verify selection while a background status request is still pending.
