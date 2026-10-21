# 0006. Spec-Driven Development with GitHub Spec Kit

Status: Partially superseded by 0019 (one-branch-per-feature naming only)
Date: 2026-09-27

## Context
Most code is written by AI agents. Without a written spec, agents fill gaps with guesses — dangerous where wrong ZMK syntax only fails at firmware build time.

## Decision
Every feature goes through GitHub Spec Kit in Claude Code: `/speckit-constitution` once (derived from AGENTS.md §7–§8), then per feature `specify → clarify → plan → tasks → analyze → implement`. One feature = one branch `NNN-short-name` = one `specs/NNN-short-name/`. Feature order and scope come from `docs/roadmap.md`. No feature code without a spec.

## Consequences
- Specs state what and why; plans apply AGENTS.md architecture and stack.
- `.specify/` and `/speckit-*` commands are installed by Spec Kit, not hand-written.
- AGENTS.md stays the source of truth; the constitution is amended when AGENTS.md changes.
- Small fixes outside a feature (typos, dependency bumps) do not need a spec.
