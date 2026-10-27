# 0009. Runtime dependencies limited to react, zod, fflate

Status: Partially superseded by 0023 (@joint/core 4.3.3 in the Schematic adapter only)
Date: 2026-09-27

## Context
Each runtime dependency adds bundle size, update work and supply-chain risk. Browser APIs cover most needs: SVG, `<dialog>`, `<details>`, `URL.createObjectURL`, CSS layout.

## Decision
Approved runtime dependencies, added only when the first feature needs them: `react`, `react-dom`; `zod` for parsing imported JSON and `localStorage` (trust boundary, `src/storage/` only); `fflate` for building the export `.zip`. Anything else requires a new ADR explaining why a few lines of our own code are not enough.

## Consequences
- No router, state manager, UI kit, icon set or date library by default.
- Dev tooling (Vite, Vitest, oxlint, oxfmt, TypeScript) is not covered by this list.
