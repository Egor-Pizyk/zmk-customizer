#!/bin/sh
# Fails when a .claude agent and its .opencode skill mirror drift apart.
# Frontmatter differs by design (Claude: tools, OpenCode skill: name/description);
# the Markdown body after the second --- must stay identical.
# See AGENTS.md §9.
set -eu

body() {
  awk 'NR==1 && $0=="---" { fences++; next } $0=="---" && fences==1 { fences++; next } fences>=2 { print }' "$1"
}

fail=0
for claude in .claude/agents/*.md; do
  name=$(basename "$claude" .md)
  skill=".opencode/skills/$name/SKILL.md"
  if [ ! -f "$skill" ]; then
    printf 'missing mirror: %s has no %s\n' "$claude" "$skill" >&2
    fail=1
    continue
  fi
  body "$claude" > /tmp/agents-sync-claude.md
  body "$skill" > /tmp/agents-sync-skill.md
  if ! diff -u /tmp/agents-sync-claude.md /tmp/agents-sync-skill.md >&2; then
    printf 'drift: %s <> %s (bodies must stay identical)\n' "$claude" "$skill" >&2
    fail=1
  fi
done
rm -f /tmp/agents-sync-claude.md /tmp/agents-sync-skill.md

# Legacy config form: skills must be auto-discovered, not listed via paths object.
if grep -q '"paths"' opencode.json; then
  printf 'opencode.json must not use legacy skills.paths; skills are auto-discovered from .opencode/skills/ and .claude/skills/\n' >&2
  fail=1
fi

# Singular .opencode/agent/ is legacy; canonical path is .opencode/agents/.
if [ -d .opencode/agent ]; then
  printf 'legacy dir .opencode/agent/ found; move contents to .opencode/agents/\n' >&2
  fail=1
fi

# Hook parity: the Claude hook and the OpenCode plugin must run the same pair.
for tool in oxfmt oxlint; do
  if ! grep -q "$tool" .claude/hooks/format-lint.sh; then
    printf 'hook parity: %s missing from .claude/hooks/format-lint.sh\n' "$tool" >&2
    fail=1
  fi
  if ! grep -q "$tool" .opencode/plugins/format-lint.ts; then
    printf 'hook parity: %s missing from .opencode/plugins/format-lint.ts\n' "$tool" >&2
    fail=1
  fi
done

exit $fail
