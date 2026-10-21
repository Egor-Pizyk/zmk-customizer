# Audit coverage and limits

Reviewed revision `a965e93` / runtime baseline `4436ad1`; 2026-10-21. No production/test changes. One isolated Linux Chromium **156.0.8078.4**, Node 24.22.0 in the existing E2E container. Custom probes use actual imported four-key Project JSON with keys (5,5),(7,5),(5,7),(7,7), initially unwired; Rebuild generates matrix wiring. Browser mouse/keyboard and read-only storage/geometry observations only. Exact fixture output: `.check-logs/035-research/wired-2x2.json`. Source research adds capability/ownership evidence, not runtime verification.

## Area and journey register

The existing suite was rerun at the reviewed runtime revision: **73/73 Chromium journeys passed**. Entries below mean bounded scenario coverage, not exhaustive product correctness. Exact journey titles/results are in the journal's log. Current visual probes supplement these tests; historical passes are not reclassified as current observations.

| Area / journey | Current evidence and outcome | Remaining limits |
|---|---|---|
| Shell/project New/Open/Save/history/reload/errors | `product.spec.ts`, `accessibility.spec.ts`, `layout-data.spec.ts` passed; actual downloaded JSON and invalid/newer imports tested | OS shortcuts/speech unperformed for whole product |
| Empty-project → layout → wiring → bindings → validated ZIP | `product.spec.ts` passed with actual ZIP contents and geometry; unwired/blocked-export repair included | Single-key creation flow; no real hardware/build claim |
| Presets/unibody/split editing and legacy imports | `presets.spec.ts`, `project-creation.spec.ts`, `wiring.spec.ts` passed, including independent split namespaces and download | Exact reported topology failure still unreproduced |
| Schematic switch geometry, pointer transforms and history | `layout-gestures`, `layout-data`, `layout-paint`, `switch-size` journeys passed; custom numeric 90° translation reproduced | Tight/original 2×2 refusal and all off-grid permutations not covered |
| Diodes/wires/contacts/sections/controller/matrix/direct/auto-routing | `wiring`, `wiring-usability`, `product`, `project-creation` passed; custom Rebuild/Complete preview/apply/tool-cancel and pointer movement observed | Exact scattered route and one-sided L-crossing hit symptom remain open |
| KLE | `kle-import.spec.ts` passed using real import/review/recovery | Not every third-party KLE export |
| Encoder hardware/actions | `encoders.spec.ts` passed for current numeric-position/A/B assignments and layer actions | Placeable/pinned/rotatable encoder is absent capability, not tested as existing feature |
| Bindings actions/layers/keycaps/legacy sizes | `action-picker`, `keymap`, `layers`, `keycap-size`, `switch-size` passed; Bindings light/dark rendered overview inspected | No macOS geometry clipboard; proposed behavior not implemented |
| Custom behaviors/combos/macros/conditional layers | `behaviors`, `advanced-keymap` passed | High-level rendered overview only; every editor/state/theme combination not visually reviewed |
| Firmware search/options/defaults/invalid draft/repair | `firmware.spec.ts` passed; light/dark overview inspected | Not every catalog option manually exercised; no compilation/hardware evidence |
| Export preview/download/blocked repair | `product`, `wiring`, `encoders`, `firmware`, advanced journeys passed using actual files; light/dark overview inspected | No new pinned firmware compilation; generated output unchanged |
| Agent package creation/download/import | `agent-package.spec.ts` passed with actual package/returned project handling | No live external AI run or guarantee arbitrary agent output works |
| Settings/help/Problems/focus | Existing `accessibility`, `schematic-panels`, relevant repair journeys passed; Settings screenshots at three sizes in both themes | All manual speech/OS cases remain open; tooltip discoverability separately recorded |

## Presentation and state register

| Condition | Actual outcome | Limit |
|---|---|---|
| 1440×900 light/dark | All four workspace overviews captured; Schematic canvas 904×747, panel 360×779; Settings bounded | Representative overview, not every editor state |
| 1024×800 light/dark | Schematic canvas 848×319.5, editors 848×287.5; document width exactly 1024; Settings captured | Other workspaces overview captured at 1440 only; suite supplies bounded desktop interaction coverage |
| 390×844 light/dark | Schematic canvas 342×275.5, editors 342×243.5; document width exactly 390; Settings fits viewport | Canvas Tools overlaps toolbar (R22); no broad mobile promise for Bindings/Firmware/Export |
| System theme | Emulated OS light/dark resolution observed in final probe | Browser media emulation, not physical OS setting change |
| Reduced motion | Context requested `reduce`; native interactions/screenshots run under it | Comparative no-preference motion audit not performed |
| 200% native zoom at 1280px | **Unperformed** | Viewport resizing is not native zoom; manual gate T005 open |
| Keyboard/focus | Current native Playwright keyboard table selection/field stepping/duplication/deletion/dialog focus/shortcuts passed; canvas-focus Escape returned Select | Not an OS-only keyboard or screen-reader speech run; tool/panel focus Escape needs original context |
| Clipboard on macOS | **Unperformed** | Linux browser context cannot establish macOS Cmd/native clipboard behavior |
| Screen reader | **Unperformed** | Names/roles/status assertions do not establish speech output |
| Long names/text-spacing overrides/full contrast measurement | **Not comprehensively performed** | No contrast conformance claim from screenshots; no token changes |

State evidence: existing journeys cover empty project, selection/multi-selection, invalid imports/options, disabled export/history/layer actions, successful downloads, pending transform/wiring previews, cancellation and exact history/persistence. Custom probes distinguish saved wiring from preview and capture a key moving outside the visible canvas during numeric rotation. Not every family × state × theme × viewport combination was executed; advanced editor mixed/error states and broad label/text-spacing review remain follow-up review gaps. Read-only encoders/current settings have no new placement/speed-snap states because those capabilities do not exist.

## Remaining acceptance

The research handoff is reviewable, but complete 035 manual audit acceptance is not claimed. T005/T009 remain open. Exact original R03/R07–R10 reproductions and material 036 decisions remain explicit in [findings](findings.md); none is closed solely by passing the existing suite. No code fix or new regression test is included.
