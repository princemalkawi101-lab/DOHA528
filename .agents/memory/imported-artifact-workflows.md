---
name: Imported artifact workflow registration
description: Handling imported artifact directories that are present on disk but absent from the artifact and workflow registries.
---

An imported project can contain a valid artifact manifest and source tree while the runtime artifact registry remains empty. Confirm registration before assuming the managed artifact workflow exists.

**Why:** A managed-workflow restart can fail even when the artifact manifest is valid. A legacy workflow also does not inject the artifact's port and base path automatically, so Vite may bind its default port while the workflow waits elsewhere.

**How to apply:** Check both the artifact registry and configured workflows. If no managed artifact is registered, configure one descriptive web workflow using the manifest's run command and explicitly provide its configured `PORT` and `BASE_PATH`; verify the bound port from logs before retrying.