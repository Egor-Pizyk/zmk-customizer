# 0024. Lazy agent context and focused review

Status: Accepted
Date: 2026-10-29

## Context
The owner requests removing blanket UI/accessibility review gates and exclusive
performance-test scheduling, and loading project context only when needed.
Mandatory startup imports and union-of-routing reading load unrelated material.

## Decision
Partially supersede ADR0018's startup/context-loading policy. AGENTS.md alone is
the startup bootstrap; load applicable sections lazily for the next decision/edit.
Reuse unchanged context, including after follow-ups; recover missing sections only.
No blanket before/after UI or manual accessibility review is a completion gate.
Focused reviews follow explicit user requests or concrete acceptance questions.
Independent work may run during performance checks; isolate only for contention
investigation. Mutation runners remain exclusive because they edit source files.
The owning workflow/testing rules override older generic review/scheduling gates.

## Consequences
Startup imports and agent adapters must not preload routed documents. Context audits
count only the bootstrap at startup while retaining other documents in the corpus.
Keyboard/accessibility product contracts, automated tests, tests-first, performance
metrics/thresholds and final changed-check requirements remain unchanged.
