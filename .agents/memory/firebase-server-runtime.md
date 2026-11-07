---
name: Firebase server runtime compatibility
description: Avoid unsupported Firebase Admin upgrades and missing Firestore optional dependencies.
---

Check the Node engine requirement before upgrading Firebase Admin, and explicitly include its compatible Firestore package.

**Why:** The workspace uses Node 20. Firebase Admin 14 requires Node 22; its Firestore dependency can also be omitted during installation, causing missing runtime support and silently untyped Firestore imports under skipped library checks.

**How to apply:** Keep the SDK compatible with the actual runtime, verify Firestore is installed rather than assuming optional dependencies were included, and run server type checks plus the emulator workflow suite after an SDK upgrade.

Credential parsing may normalize only lossless formatting, never reconstruct private-key contents or silently accept malformed credentials.

**Why:** Production reported invalid JSON even though the user said they copied the original Firebase file. Formatting variants are plausible, but the secret must not be inspected or guessed to diagnose them.

**How to apply:** Test parsing with synthetic fixtures, preserve private-key bytes, distinguish malformed JSON from the wrong Firebase file type, and confirm production separately; support for formatting variants does not prove which variant the user supplied.
