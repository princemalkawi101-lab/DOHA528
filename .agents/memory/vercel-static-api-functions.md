---
name: Vercel static artifact API functions
description: The Power Healing Vercel deployment uses a static output directory, so production API handlers must live in the repository-level api directory.
---

Vercel does not execute JavaScript files copied from the frontend artifact's public directory as Serverless Functions when the deployment uses a static output directory.

**Why:** A frontend request can reach the same `/api/...` path locally through Replit's API artifact while returning a non-function response in the published static deployment.

**How to apply:** Keep production Vercel handlers under the repository-level `api/` directory, or configure a separate API origin and set `VITE_API_URL`; keep frontend `public/api` files only when they are intentionally static.

Root serverless handlers and their backend imports must have Node typings available in the root TypeScript context, not only in the API artifact.

**Why:** The API artifact's own type check can pass while Vercel reports missing `process` on the same imported backend source, because the root config previously inherited an empty ambient-types list.

**How to apply:** Preserve root-visible Node typings and check the root serverless entry point as well as the workspace build when changing TypeScript configuration. Include strict NodeNext module resolution: the workspace's bundler resolution accepts extensionless imports that Vercel's ESM compilation can reject. Follow the imported server dependency chain, not only the entry file.

Use shared Node and DOM ambient typings across the workspace, including the API server.

**Why:** The user explicitly requested workspace-wide recognition of `process`, `fetch`, and `Response` rather than repeated per-file fixes.

**How to apply:** Keep Node in `compilerOptions.types`, DOM in `compilerOptions.lib`, and `skipLibCheck` enabled. Check leaf overrides so they retain these globals. Match serverless compatibility checks to this shared library set; these declarations do not provide browser APIs at runtime.

Cross the root CommonJS serverless adapter to the API artifact's ESM package using native dynamic imports.

**Why:** The live Vercel log confirmed `ERR_REQUIRE_ESM`: compiled static imports became `require()` calls against the ESM artifact and crashed before authentication. Type checks alone did not expose it; newer local Node versions can also accept `require(ESM)` and conceal the incompatibility.

**How to apply:** Preserve native `import()` in emitted CommonJS adapters and cover all event entry points, including webhooks. Verify the real emitted dependency graph with `--no-experimental-require-module` as well as TypeScript checks, without changing the entire workspace module format.