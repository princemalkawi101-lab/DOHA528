---
name: Vercel static artifact API functions
description: The Power Healing Vercel deployment uses a static output directory, so production API handlers must live in the repository-level api directory.
---

Vercel does not execute JavaScript files copied from the frontend artifact's public directory as Serverless Functions when the deployment uses a static output directory.

**Why:** A frontend request can reach the same `/api/...` path locally through Replit's API artifact while returning a non-function response in the published static deployment.

**How to apply:** Keep production Vercel handlers under the repository-level `api/` directory, or configure a separate API origin and set `VITE_API_URL`; keep frontend `public/api` files only when they are intentionally static.