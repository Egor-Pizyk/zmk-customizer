# 0018. Task-scoped agent context and proportional SDD

Status: Partially superseded by 0024 (context loading) and 0025 (test execution timing)
Date: 2026-10-15

## Context
Mandatory loading of every guideline and ADR repeats current rules, loads superseded history and hides task-specific context. Generic Spec Kit templates disagree with project tests-first requirements.

## Decision
Supersede only ADR 0016's mandatory-all-documents context policy. AGENTS.md loads product, principles, workflow and agent rules at startup, and routes mandatory additional reading by task. Architecture, module APIs and infrastructure decisions in ADR 0016 remain in force.
Each rule has one normative owner; ADRs preserve rationale, feature artifacts preserve requirements and evidence, and the constitution is a compact projection. Path-scoped Claude rules reuse the same files; other agents follow the explicit routing table.
Use full SDD for new capabilities and changed contracts, amend existing artifacts for extensions and regressions, and use focused checks for prose-only work. Project Spec Kit skills/templates must honor tests-first and requirement-to-evidence traceability. Load each skill only for its stage.

## Consequences
Startup context is smaller while applicable rules remain mandatory. Keep the routing table, adapters and project templates synchronized when rules change. Evaluate routing with domain bugs, UI features, generator changes and documentation tasks; check context selection, preserved contracts and evidence rather than token count alone.
