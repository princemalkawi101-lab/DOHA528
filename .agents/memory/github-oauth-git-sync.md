---
name: GitHub authentication for Git sync
description: Why this workspace uses a repository-scoped SSH deploy key instead of Replit's stale HTTPS Git credential.
---

The Replit GitHub connector can be fully authorized while `git push` over the local HTTPS remote still fails with an invalid-token error. Connector OAuth is available through the managed GitHub REST proxy, but it is not automatically injected into the local Git credential helper.

This workspace intentionally uses a repository-scoped SSH deploy key with write access for normal Git fetch and push. Keep the `origin` remote on SSH and preserve the repository-local SSH command configuration.

**Why:** Reconnecting GitHub and reopening the workspace did not refresh the invalid HTTPS credential supplied by `replit-git-askpass`. A write-enabled deploy key limits access to this repository and restores ordinary Git-pane sync without a broad personal token.

**How to apply:** Use ordinary `git fetch` and `git push`; do not switch `origin` back to HTTPS or use the managed API as the routine workaround. A fresh clone or rebuilt workspace will need a new repository-scoped deploy key because private key material is never committed.