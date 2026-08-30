---
name: GitHub OAuth Git sync
description: How GitHub connector authorization differs from local Git credential authentication in this workspace.
---

The Replit GitHub connector can be fully authorized while `git push` over the local HTTPS remote still fails with an invalid-token error. Connector OAuth is available through the managed GitHub REST proxy, but it is not automatically injected into the local Git credential helper.

**Why:** Treating connector authorization as proof that the shell's Git credential is repaired causes repeated failed pushes and the generic sync error remains.

**How to apply:** Try normal `git push` once after authorization. If it still reports invalid credentials, use the managed GitHub API to transfer verified Git objects and fast-forward the branch, checking blob, tree, commit, and final branch SHAs before declaring success.