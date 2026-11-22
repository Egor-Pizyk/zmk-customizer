# 0023. JointJS as a disposable Schematic projection

Status: Accepted
Date: 2026-10-26

## Context
The owner selected JointJS to replace Schematic diagram infrastructure while retaining Project → diagram → domain-operation authority. Existing SVG interactions encode durable contacts, electrical sections, selective insulation and accessible gestures that stock tools do not preserve automatically. See specs/038-jointjs-schematic-editor/research.md.

## Decision
Approve exactly @joint/core 4.3.3 (MPL-2.0, no declared runtime/peer dependencies) solely behind src/ui/schematic/diagram/logic, with a React-owned host and library-owned scene. No @joint/react, Plus, libavoid or remote services. Project/provider/domain operations and project history remain authoritative. No graph serialization, auto-routing or graph-change-to-commit pipeline. Keep native accessible controls and existing gesture policies; classify recoverable external renderer-call failures only at that boundary. Domain/application errors still reach the root boundary.

Partially supersedes ADR0008 only for Schematic scene ownership and ADR0009 only for this exact package/scope. SVG, accessible alternatives and the unchanged Bindings renderer remain. No authored application subclasses, new context, schema migration or domain package allowance.

## Consequences
Pin/lock and retain upstream notice; measure bundle cost and baseline parity. Own adapter synchronization, event normalization, focus, cancellation and cleanup. Enforce package import boundaries in architecture checks before first production use. Browser/legacy/output/manual acceptance gates remain; source API availability is not proof of adoption. Unexpected need for paid features, changed electrical rules or a schema change requires amended scope/decision.
