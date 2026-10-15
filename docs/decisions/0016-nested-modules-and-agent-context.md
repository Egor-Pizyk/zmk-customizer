# ADR 0016: Nested module APIs, infrastructure and agent context

Status: Partially superseded by 0018 (agent context only); module APIs and infrastructure remain accepted
Date: 2026-10-14

## Context
Large parent APIs hide responsibility boundaries. Root infrastructure and OpenCode integration add clutter. Agents need explicit mandatory docs and selective feature context.

## Decision
Supersede ADR 0015's single domain/generator API with separate exact aliases and explicit named indexes for every populated responsibility group. Parent APIs contain only shared root contracts. Resolve ownership by the longest matching module root and preserve layer restrictions through defining-file export tracing. Internal imports stay relative; cross-group imports use the owning alias.
Keep Dockerfiles, Compose, nginx, Dockerfile-specific ignore files and pinned ZMK build infrastructure in infra; Makefile stays at the root. Preserve root contexts and mounts and explicit Compose project names.
Remove OpenCode and its synchronization gate. AGENTS.md explicitly imports mandatory product/architecture/workflow/rules/testing docs, every guideline and ADR, and a feature directory index; feature artifacts are read on demand. Agents without @ import expansion read the same files manually.

## Consequences
Smaller APIs expose module dependencies. Existing implementation cycles must be resolved without relaxing the cycle or architecture gates. No runtime dependency, schema, user journey or generated firmware changes.
