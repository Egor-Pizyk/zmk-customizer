#!/usr/bin/env bash
# Read-only startup/resumption snapshot. No fetch, checkout or selection writes.
set -euo pipefail
repo_root="$(git -C "$(dirname "${BASH_SOURCE[0]}")" rev-parse --show-toplevel)"
cd "$repo_root"
printf 'Branch: %s\nRevision: %s\n' "$(git branch --show-current)" "$(git rev-parse HEAD)"
printf '\nWorking tree (including staged paths):\n'
git status --short
printf '\nUnstaged diff summary:\n'
git diff --stat
printf '\nStaged diff summary:\n'
git diff --cached --stat
printf '\nSpec Kit selection (verify against request; not feature ownership):\n'
bash .specify/scripts/bash/check-prerequisites.sh --paths-only --json
