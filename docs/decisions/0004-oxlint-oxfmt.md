# 0004. oxlint + oxfmt instead of ESLint/Prettier

Status: Accepted
Date: 2026-09-27

## Context
Lint and format run in `make check`, CI, and after every agent edit (`.claude/settings.json` hook). They must be fast on single files and need little configuration.

## Decision
oxlint with the strict config in `.oxlintrc.json`; lint errors fail CI. oxfmt as the formatter, invoked through the `format` / `format:check` npm scripts. No ESLint, no Prettier.

## Consequences
- Near-instant runs make per-edit hooks practical.
- Some ESLint plugin rules have no oxlint equivalent; missing rules are covered by review until oxlint adds them. Architectural rules (layer direction, AGENTS.md §3.1) get a lint rule only when a violation appears.
- Formatting is not discussed in review: run the formatter.
