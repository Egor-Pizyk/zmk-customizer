# Schematic physical-layout UI/UX review — 2026-10-19

Scope: a trial review requested by the user, using the project-local `ui-ux-pro-max` skill. No production fixes or new product requirements were implemented. Owning contracts: [012 spec](spec.md), especially US3, FR-003, FR-016 and SC-001; [001 shell spec](../001-app-shell-ui/spec.md), FR-031/032; [field validation rules](../../docs/guidelines/frontend/admin-ui.md#validation-display). Presets supply reproduction data, not feature ownership. The Spec Kit resolver selected 031 because of the current branch; this review concerns 012 and the shared shell.

## Method and evidence

Built the current working tree using `docker compose -p zmk-customizer -f infra/compose.yaml run --rm app npm run build` (passed; existing bundle-size warning: 781.17 kB JS, 224.33 kB gzip). Served that build on a dedicated port 4176 and launched isolated Playwright Chromium contexts without a normal browser profile. Used native UI actions to create the Corne 6-column preset, center it, select a key, open precise editing, enter a numeric value and navigate tools. DOM evaluation was observation-only.

Reviewed empty and populated screens at 1440×1000 light/dark and 1024×768 light, with reduced motion enabled. The focused reproduction script `test-results/ui-ux-audit/verify.mjs` completed three sequential runs with consistent measurements. An additional validation probe confirmed the field-error finding below. These are exploratory audit scripts, not committed regression tests or a run of the full E2E suite.

Skill guidance used:

- `"focus not obscured" --domain ux`: AA minimum and AAA enhanced results distinguished; relevant to focus visibility, not evidence of a WCAG failure by itself.
- `"dragging movements" --domain ux`: single-pointer and keyboard alternatives. Precise numeric controls exist; no drag-only defect established in this review.
- `"keyboard navigation" --domain ux`: focus and predictable widget traversal.
- `"responsive overflow toolbar" --stack html-tailwind`: compact layout guidance was relevant; unrelated image suggestions were discarded.
- `"input width overflow" --stack html-tailwind`: general input sizing guidance; input clipping was established by rendered measurements, not by the search ranking.
- Read `references/quick-reference.md` and `references/pro-rules.md`. Native-only units, authentication, remote font suggestions and unrelated performance changes were not applied. Phones are explicitly outside the shell's FR-032 scope.

Generated screenshots, scripts and JSON observations are retained locally in ignored `test-results/ui-ux-audit/`; they are not versioned evidence. Principal images: `preset-1440-light.png`, `preset-1440-dark.png`, `precise-1024.png` and `table-1024.png`. Measurements: `verified.json`, `recheck-2.json`, `recheck-3.json`, `validation.json`. Reproduce the findings below if these temporary artifacts are unavailable.

## Findings

### UI-012-01 — Tool arrows unexpectedly move focus to the canvas

Status: confirmed, open. Priority: high. Basis: 001 FR-031; 012 US3/SC-001.

Reproduce: open Schematic, activate “Edit selected layout”, press Shift+Tab to focus the selected Select radio, then ArrowRight. Key becomes selected, but the active element becomes the canvas SVG (`role="application"`), rather than remaining on the Key radio. Continued arrows operate the canvas instead of traversing the tool choices. Reproduced at both desktop sizes in all three focused runs.

Cause: `src/ui/schematic/tools/components/tool-window.tsx`, `handleToolChange`, unconditionally schedules canvas focus for every selection change, including native radio keyboard changes.

Expected outcome for a future fix: native arrow navigation stays inside the radio group; entering the canvas remains an explicit, predictable keyboard action. Preserve the intended pointer workflow. Regression check: native Tab/arrow traversal through Select → Key → Wire, asserting selected tool, focus and absence of unintended canvas actions.

### UI-012-02 — Edit-selected shortcut does not focus precise editing

Status: confirmed, open. Priority: medium. Basis: 012 FR-016/US3; 001 FR-031.

Reproduce: create Corne, select Key 0 through the Parts checkbox, activate “Edit selected layout”, wait for Selected width to become visible. Precise properties opens, but focus remains on the originating button. Reproduced at both desktop sizes in all three focused runs.

Cause: `tool-window.tsx`, `handleEditClick`, focuses `[data-layout-controls] input`. The first matching input is the KLE file chooser inside a closed details element, so focusing it fails. It is not a precise-property field.

Expected outcome: open precise properties and move focus to the intended visible numeric field after it mounts. Regression check: activate by keyboard and pointer with KLE import collapsed, assert the intended field is focused and can immediately accept input.

### UI-012-03 — Numeric table values are clipped at the supported minimum width

Status: confirmed, open. Priority: high. Basis: 001 FR-032 (usable at 1024 px and above), 012 FR-003.

Reproduce: use Corne at 1024×768, enter `12.3456` in “Key 0 Y (u)” and commit with Enter. The value is retained, but the field is only 39.27 CSS px wide (37 px client width, 80 px scroll width). The value cannot be read in full; even ordinary preset values such as `0.37` appear truncated in the initial table. At 1440 px the same field is 82.20 px wide. Reproduced in all three focused runs.

Expected outcome: keep numeric values legible through a minimum field/column width, a deliberately scrollable table, or a compact editing presentation. Do not shrink inputs below their useful content width. Regression check: at 1024 px verify full representative signed/decimal values and keyboard edit/commit remain usable; allow table-local overflow without widening the entire application.

### UI-012-04 — Wiring errors mark valid geometry fields as invalid

Status: confirmed, open. Priority: medium. Basis: field-level validation rules in admin-ui.md; 012 FR-003/006.

Reproduce: create the Corne preset without changing geometry. Key 0 has incomplete wiring and a diode-direction problem. All seven geometry fields, including width=1, height=1 and rotation=0, have `aria-invalid="true"` and red borders although the displayed errors concern wiring and diode direction. This misdirects repair effort and announces valid numeric input as invalid.

Cause: `src/ui/schematic/parts/components/parts-keys-table-rows.tsx` passes any key-level problem as `hasProblem`; `key-position-cells.tsx` applies it to every numeric field.

Expected outcome: keep key-level electrical problems on the row and appropriate wiring/diode controls; mark geometry fields invalid only for applicable geometry problems. Regression check: distinguish an unwired valid key from a genuinely invalid size/overlap case, preserving all problem messages and export blocking.

### UI-012-05 — Little canvas space and no one-action fit-to-layout overview

Status: observed UX limitation; proposed enhancement, not an established contract violation. Priority: medium. Basis: 012 FR-010 and the core physical-layout workflow; 001/012 currently promise centering, not automatic fitting.

Reproduce: create Corne, click Center keyboard at 100% zoom with Parts expanded. At both tested desktop sizes the canvas is only 224 px high. Keys k3/k8 extend about 5.76 px above its bounds and k38/k39 about 5.15 px below. Ruler and floating-panel overlays further reduce useful space. The screenshot shows cut top rows and thumb corners. Negligible subpixel differences for other keys are excluded from the finding.

Recommendation: specify an explicit “Fit keyboard” action with padding that accounts for the visible work area, and consider collapsing secondary hardware details to give the physical layout more space. Keep “Center keyboard” semantics stable unless a spec explicitly changes them. Acceptance for a proposed enhancement: all Corne keycap corners fit inside the useful viewport at both supported desktop sizes, without changing project geometry; keyboard operation and saved-view behavior are defined.

## Limits and next step

This was a focused trial, not the comprehensive roadmap 035 audit. No full `make check`, full E2E suite, Firefox/WebKit, assistive-technology speech, contrast measurements, browser text zoom, or firmware build was run. Light/dark appearance was inspected from rendered screenshots; this does not establish contrast compliance. Reduced-motion emulation was enabled but every animation path was not exercised. Existing numeric alternatives were observed, not exhaustively tested for every drag operation.

All findings remain open. Before fixes, reconcile the accepted expected outcomes with the owning feature spec/plan/tasks under docs/workflow.md, then add failing regression coverage and implement. UI-012-05 needs an explicit product requirement before implementation; the current Center action alone does not promise fit-to-layout.
