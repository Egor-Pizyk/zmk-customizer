# 0022. Evidence-based mechanical technology selection

Status: Accepted
Date: 2026-10-21

## Context
The user requires a dedicated 2.0.0 research feature to choose languages, frameworks and a geometry kernel for an independent mechanical module, including complex future geometry without unacceptable performance loss.
Current TS/React rules do not establish CAD feasibility; lower-level languages do not establish end-to-end speed by themselves.

## Decision
Require the separate [mechanical-technology-research feature](../roadmap-2.0.0.md#dedicated-feature--mechanical-technology-research) before production CAD integration or stack migration.
Compare a TS-oriented baseline, Rust/WASM and credible lower-level alternatives such as C/C++/WASM, including hybrid designs.
Evaluate UI/framework, renderer, orchestration language and geometry kernel separately with equivalent fixtures, output quality and measured browser costs.
Cover offline/static constraints, genuine STEP and printing outputs, correctness, responsiveness, memory, recovery, licensing, tooling and maintenance.
Record reproducible evidence and independent critique; discuss material tradeoffs with the user.
The research must produce a separate final selection ADR identifying the chosen stack, rejected alternatives, evidence and consequences.

## Consequences
This ADR accepts an evaluation process only; no language, kernel, renderer, dependency or rewrite is selected or authorized.
Current architecture, stack and dependency rules remain effective; no existing ADR is superseded here.
Physical reference-build and beginner-workflow checks remain separate future gates; benchmarks cannot replace them.
