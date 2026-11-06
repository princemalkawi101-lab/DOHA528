import { defineConfig } from '@playwright/test';
import { existsSync } from 'node:fs';

if (process.env.FIRESTORE_EMULATOR_HOST !== '127.0.0.1:8185'
  || process.env.FIREBASE_AUTH_EMULATOR_HOST !== '127.0.0.1:9198') {
  throw new Error('Run pnpm test:event-registration-browser; both isolated emulators are required.');
}

export default defineConfig({
  testDir: '.',
  testMatch: '**/*.spec.mjs',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 45_000,
  expect: { timeout: 10_000 },
  outputDir: '../../generated-artifacts/event-registration-browser',
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:3199',
    browserName: 'chromium',
    headless: true,
    // Replit's wrapped Chromium includes the Nix runtime libraries. Elsewhere,
    // use Playwright's normal installed browser.
    launchOptions: {
      executablePath: existsSync('/repl/tools/bin/chromium') ? '/repl/tools/bin/chromium' : undefined,
    },
    viewport: { width: 1440, height: 1000 },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'pnpm --filter @workspace/power-healing exec vite --config vite.browser-tests.config.ts',
    cwd: '../..',
    url: 'http://127.0.0.1:3199/login',
    reuseExistingServer: false,
    timeout: 60_000,
  },
});
