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

Do server-only compatibility checks without the DOM library (`--lib es2022`).

**Why:** Default TypeScript libraries include DOM fetch declarations, which can hide connector SDK response-typing problems that appear in Node-only builds.

**How to apply:** Verify connector-consuming server entry points with Node types and the server's library set; do not add browser libraries just to silence backend response errors.