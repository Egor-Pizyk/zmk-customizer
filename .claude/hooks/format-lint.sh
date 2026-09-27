#!/bin/sh
# PostToolUse hook: format + lint the single .ts/.tsx file Claude just edited.
# No-op (exit 0) when jq or host-runnable node_modules are missing: Node deps are
# normally installed inside Docker (docs/decisions/0005), and `make check` stays the gate.
# Exit 2 = lint errors, shown to Claude.

command -v jq >/dev/null 2>&1 || exit 0
file=$(jq -r '.tool_input.file_path // empty')
case "$file" in *.ts|*.tsx) ;; *) exit 0 ;; esac
[ -f "$file" ] || exit 0

cd "${CLAUDE_PROJECT_DIR:-.}" || exit 0
bin=node_modules/.bin
# --version probe: linux binaries installed by the container fail here on macOS hosts.
"$bin/oxfmt" --version >/dev/null 2>&1 && "$bin/oxfmt" "$file" >/dev/null 2>&1
"$bin/oxlint" --version >/dev/null 2>&1 || exit 0
out=$("$bin/oxlint" "$file" 2>&1) || { printf '%s\n' "$out" >&2; exit 2; }
exit 0
