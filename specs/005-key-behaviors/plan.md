# Implementation Plan: Key behaviors

**Branch**: `005-key-behaviors` | **Date**: 2026-09-29 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/005-key-behaviors/spec.md`

## Summary

Expose every self-contained binding the project already stores as a choosable behavior in the Bindings action panel (phase 0: `trans`, `none`, `caps_word`, `key_repeat`, `gresc`, `bt`, `out`, `sys_reset`, `bootloader` alongside the existing `kp`/`mt`/`sk`/`kt` flows), then add two new self-contained binding kinds — tap-dance (ordered key-sending taps + resolving pause) and mod-morph (normal action, morphed action, trigger modifier set) — across all layers: domain types + validation + edit operations, catalog entries with v0.3 docs links, storage schema acceptance, and panel UI (behavior list, parameter editors, legends, names, search). No layer behaviors, no combos/macros, no keymap text generation. Work proceeds one behavior per change; tests first.

## Technical Context

**Language/Version**: TypeScript 7, `strict` + `erasableSyntaxOnly` (no enums/namespaces; no `any`, no non-null `!`, no `as` except `as const`; zod parsing yields typed values)

**Primary Dependencies**: `react` + `react-dom` (UI), `zod` (storage trust boundary — the only dependency this feature touches); `fflate` unused here

**Storage**: `localStorage` autosave + versioned JSON project file, parsed by `src/storage/project-schema.ts` (current `schemaVersion: 3`). Additive binding-union change: no migration, version stays 3 (old files contain no new kinds; see research R6)

**Testing**: Vitest; unit tests next to code as `*.test.ts(x)`; no UI test infra in repo — panel behavior verified manually via headless Chrome + CDP against the dev server (pattern in spec assumptions); `make check` (typecheck + lint + format + tests) must stay green

**Target Platform**: Static SPA served from `dist/` (Vite + nginx); offline after load; modern browsers

**Project Type**: Static web application, no backend

**Performance Goals**: No visible lag with 100 keys (spec 004 SC-007 carries over); new code adds no per-render iteration beyond existing tab/item maps

**Constraints**: AGENTS.md §3–§4 + §7–§8: layer direction `ui → storage → generators → domain ← catalog`; one exported concept per file in `domain/`; oxlint limits (≤40 lines/function, ≤3 params, ≤10 imports/file); Tailwind semantic tokens only; ZMK v0.3 target — anything marked main-only is never offered; Conventional Commits, one behavior per change

**Scale/Scope**: ~15 binding kinds total after this feature; single-user local app; touches `domain/`, `catalog/`, `storage/`, `ui/bindings/` only

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | How this plan satisfies it |
|---|---|---|
| I. Correct output over features | ✅ pass | No generator changes (no `src/generators/` yet) → golden tests N/A; correctness is guarded by storage round-trip tests + validation tests per behavior |
| II. Domain first | ✅ pass | New rules (tap list, pause range, morph distinctness) live in `src/domain/` as pure tested functions; UI only dispatches |
| III. Static only | ✅ pass | No network calls; no new dependencies |
| IV. User data is untrusted | ✅ pass | New kinds accepted by zod schema; malformed parts rejected with named errors; out-of-range values load as Bindings validation issues, never corrupt state |
| V. Every ZMK option explains itself | ✅ pass | Each new `BEHAVIORS` entry carries description + v0.3 `docsUrl`; catalog test enforces it |
| VI. Minimal code | ✅ pass | No `keep-mods` (not required by spec FR-010); no new picker tab (System rows + parameter section); one concept per file; see research R3/R5 |
| VII. Deterministic | ✅ pass | No randomness/time in new code; legend truncation already locale-independent |
| VIII. Accessible | ✅ pass | New controls keyboard-reachable and labeled; keycap table shows new behaviors via shared `formatBindingName` with no extra work |

Post-design re-check: no violations introduced; no Complexity Tracking entries needed.

## Project Structure

### Documentation (this feature)

```text
specs/005-key-behaviors/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
│   └── binding-json.md  # JSON shapes of the new bindings (accept/reject rules)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
src/
├── domain/
│   ├── types.ts                      # Binding union += tap_dance, mod_morph
│   ├── validate-bindings.ts          # new-kind checks (assertNever guides)
│   ├── set-tap-dance-*.ts            # one op per edit (pattern: set-keycode.ts)
│   ├── set-mod-morph-*.ts
│   └── *.test.ts                     # tests first, next to code
├── catalog/
│   ├── behaviors.ts                  # BEHAVIORS += entries (guard enforces fullness)
│   └── behaviors.test.ts             # panel order now 15 entries
├── storage/
│   └── project-schema.ts             # bindingSchema += new variants (v3 stays)
└── ui/bindings/
    ├── behavior-section.tsx          # behavior list for all kinds (no longer kp-only)
    ├── tap-dance-options.tsx         # parameter editor (new file if needed)
    ├── mod-morph-options.tsx         # parameter editor (new file if needed)
    ├── format-binding-legend.ts      # legends ≤7 chars (assertNever guides)
    ├── format-binding-name.ts        # full names (assertNever guides)
    └── picker-tabs.ts                # System rows += tap-dance / mod-morph starters
```

**Structure Decision**: Single static SPA; no new folders (per AGENTS.md §3.1 folders appear only with their first file — the two `*-options.tsx` editors appear only if the parameter UI does not fit the existing `KeyOptions` shape; default is to extend `KeyOptions` in place).

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

None — no violations.
