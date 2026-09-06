#!/bin/bash
set -e

# Task branches can legitimately change package manifests and the lockfile in
# parallel. Reconcile them non-interactively after merge instead of failing on
# a temporarily stale lockfile.
pnpm install --no-frozen-lockfile
pnpm --filter @workspace/db push
