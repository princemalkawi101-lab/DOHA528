# Event registration browser regressions

Run from the workspace root:

```sh
pnpm install --frozen-lockfile
pnpm exec playwright install chromium
pnpm test:event-registration-browser
```

Requires Java 21+ for the Firestore emulator and Chromium's system libraries.
On Replit the config uses the supplied Nix-compatible Chromium wrapper; elsewhere
it uses the browser installed by Playwright.
The command starts/stops its own Auth and Firestore emulators and test-only Vite
server. Ports 3199, 8185, 9198, 4415, and 4515 must be free. It deliberately
refuses to reuse an existing web server or run without both emulator addresses.

## Isolation and scope

- Uses the `demo-power-healing-browser` project, random `@example.test`
  identities, emulator-only admin claims, and synthetic registrations.
- Exercises the actual login form, AuthProvider, Admin page, Firestore
  `onSnapshot` subscriptions, checked-in security rules, CSV generation, and
  browser download events. The CSV assertions use independent expected rows.
- A separate Vite config substitutes only Firebase initialization, disables
  `.env` loading, and never changes the production Firebase setup. No real
  credentials are required.
- Browser requests are restricted to the local test app and emulator ports.
  All `/api/` requests fail closed unless a test explicitly intercepts them.
  Review and email responses are simulated and write synthetic updates through
  the rules-disabled emulator setup context. No payment is created and no email
  is sent. Backend review/email correctness remains covered separately by
  `tests/event-workflow.test.mjs`.
- Each test resets Firestore and browser storage. Identities disappear when
  the non-persistent Auth emulator stops. Never point this suite at a shared
  development or production database.
- Loading is tested by delaying actual emulator traffic; errors are tested by
  denying event-registration reads in the emulator, including after rows have
  already loaded. The app subscription/exporter are not mocked.

Coverage includes signed-out and signed-in non-admin access denial; all three
CSV selections, Arabic/quoted names, missing legacy email, UTF-8 BOM, filenames,
private-field exclusions, search independence; empty/loading/error/busy
download guards; live changes from another writer; approval, rejection, and
retry-email controls with authenticated request payloads.

Failure screenshots and traces, plus an authenticated success screenshot, go to
`generated-artifacts/event-registration-browser/` (ignored by Git/deployment).
Open a failed trace with `pnpm exec playwright show-trace <trace.zip>`.
