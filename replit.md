# Power Healing

## Overview

Arabic RTL wellness and e-commerce website for DOHA — مساحة الشفاء. The React app lives in `artifacts/power-healing` inside the existing pnpm workspace.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 20
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React 19 + Vite 7
- **Styling**: Tailwind CSS 4
- **Routing**: Wouter
- **External services used by the source**: Firebase and PayPal

## Key Commands

- `pnpm install --frozen-lockfile` — install the locked workspace dependencies
- `PORT=23900 BASE_PATH=/ pnpm --filter @workspace/power-healing run dev` — run the site in Replit
- `pnpm --filter @workspace/power-healing run typecheck` — typecheck the site
- `pnpm --filter @workspace/power-healing run build` — build the production site

The configured Replit workflow is **Power Healing Web** and serves the app at the root preview path.
