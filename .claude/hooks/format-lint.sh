#!/bin/sh
# PostToolUse hook: format + lint the single .ts/.tsx file Claude just edited.
# `make check` stays the gate: this hook is fast feedback only, never a substitute.
# Exit 2 = lint errors, shown to Claude. Missing jq/binaries warn on stderr, exit 0.
#
warn() { printf 'format-lint hook: %s\n' "$1" >&2; }

command -v jq >/dev/null 2>&1 || { warn "jq missing, skipped (run make check)"; exit 0; }
file=$(jq -r '.tool_input.file_path // empty')
case "$file" in *.ts|*.tsx) ;; *) exit 0 ;; esac
[ -f "$file" ] || exit 0

cd "${CLAUDE_PROJECT_DIR:-.}" || exit 0
bin=node_modules/.bin
# --version probe: linux binaries installed by the container fail here on macOS hosts.
if ! "$bin/oxfmt" --version >/dev/null 2>&1; then
  warn "oxfmt not runnable on this host (likely Linux binaries in Docker volume), skipped (run make check)"
else
  "$bin/oxfmt" "$file" >/dev/null 2>&1
fi
if ! "$bin/oxlint" --version >/dev/null 2>&1; then
  warn "oxlint not runnable on this host, skipped (run make check)"
  exit 0
fi
out=$("$bin/oxlint" "$file" 2>&1) || { printf '%s\n' "$out" >&2; exit 2; }
exit 0
