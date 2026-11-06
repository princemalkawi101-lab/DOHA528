---
name: Local browser-test tooling constraints
description: Non-obvious Firebase CLI and Chromium constraints for isolated browser regressions.
---

Keep Firebase emulator configuration at a directory level that contains its rules file; do not use parent traversal to reference rules outside that directory.

**Why:** Firebase CLI rejects an otherwise valid rules file outside its configuration's project directory before starting any browser tests.

**How to apply:** For a test-only emulator configuration referencing the workspace's real rules, keep that configuration at the workspace root.

Use Replit's supplied Chromium wrapper when available rather than a downloaded browser executable.

**Why:** Downloaded Chromium binaries do not automatically find Nix shared libraries and can exit before creating a page even after installation succeeds.

**How to apply:** Retain a normal Playwright-installed-browser path for other environments, but prefer the Replit wrapper locally.
