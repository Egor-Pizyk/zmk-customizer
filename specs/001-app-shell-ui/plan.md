# Implementation Plan: Application Shell and Workspaces

**Branch**: `001-app-shell-ui` | **Date**: 2026-09-27 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/001-app-shell-ui/spec.md`

## Summary

This feature builds the app frame and contains no keyboard editing:
- a left tab bar with four workspaces (Schematic and Bindings are canvases; Firmware and Export are placeholders);
- a project bar with actions that are shown but not available yet;
- canvas work surfaces with a grid, snapping, rulers, minimap, pan/zoom and a status bar;
- a floating tool window, in Schematic only;
- a problems panel with tab badges and one polite live region;
- keyboard shortcuts (Alt+Shift globals, canvas-scoped single keys incl. arrow-key pan) with a help dialog;
- a settings dialog with Light/Dark/System themes and shared grid settings.

All state is UI preferences, persisted in `localStorage` and parsed with zod. Themes are one attribute switch over `light-dark()` tokens. The canvas is SVG. Non-trivial logic lives in pure functions with unit tests.

## Technical Context

**Language/Version**: TypeScript 7 (strict, `erasableSyntaxOnly`), ES2024 target (tsconfig) via Vite

**Primary Dependencies**: React 19, Tailwind CSS v4 (build-time), **zod 4** (added now; approved in AGENTS.md §4, used only in `src/storage/`)

**Storage**: `localStorage` key `zmk-customizer:preferences`, JSON version 1 (`contracts/preferences-storage.md`)

**Testing**: Vitest (node env), colocated `*.test.ts` for pure logic; manual scenarios in `quickstart.md`

**Target Platform**: current desktop Chrome, Edge, Firefox, Safari (needs CSS `light-dark()`: Chrome 123+, Firefox 120+, Safari 17.5+); static files served by nginx with strict CSP

**Project Type**: static single-page web app (no backend)

**Performance Goals**: pointer readout and pan at display rate (60 Hz) without re-rendering the shell; theme/workspace switch perceived < 100 ms (SC-003)

**Constraints**:
- no network;
- CSP `script-src 'self'`, `style-src 'self'`;
- usable at ≥ 1024 px width;
- WCAG 2.2 AA;
- no new dependencies beyond zod.

**Scale/Scope**: about 45 source files (≈ 11 primitives, 9 shell files, 9 canvas files, 4 workspaces, storage, shortcuts); 1 persisted object

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Evidence |
|---|---|---|
| I. Correct output over features | N/A | No generator or ZMK output in this feature |
| II. Domain first | Pass | No project rules exist yet. UI math (snap, zoom, clamp, parse) is in pure tested functions, not in components |
| III. Static only | Pass | No network. `theme-init.js` is a same-origin static file |
| IV. User data is untrusted | Pass | `localStorage` is parsed with zod, fields fall back one by one, corrupt data is not overwritten on load (R3) |
| V. Every ZMK option explains itself | N/A | No ZMK options. Firmware is a placeholder |
| VI. Minimal code | Pass, with notes | No router, no shortcut or UI library, no DOM test library. Justified deviations are listed in Complexity Tracking |
| VII. Deterministic | N/A | No generators. Snapping rounds deterministically (R6) |
| VIII. Accessible | Pass | Landmarks, skip link, `<title>` and names per `contracts/ui-regions.md`; every action is keyboard reachable; no global single-key shortcuts (2.1.4); arrow-key pan is the keyboard alternative to pointer pan and minimap drag (2.1.1); tooltips dismiss with Escape (1.4.13); reduced motion is respected; contrast is checked per theme |
| Constraint: target ZMK v0.3 | N/A | No ZMK output |
| Constraint: `make check` | Required | Final task |

**Post-design re-check (after Phase 1)**: unchanged, all gates pass. The deviations below are recorded rather than hidden.

## Project Structure

### Documentation (this feature)

```text
specs/001-app-shell-ui/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── preferences-storage.md
│   ├── shortcuts.md
│   └── ui-regions.md
├── checklists/requirements.md
└── tasks.md             # /speckit-tasks
```

### Source Code (repository root)

```text
index.html                         + <script src="/theme-init.js"> in <head>
public/
└── theme-init.js                  pre-paint theme, regex read, no JSON.parse (R2)
src/
├── main.tsx                       renders <App /> in StrictMode
├── styles.css                     light-dark() tokens, data-theme (R1)
├── storage/
│   ├── preferences.ts             Preferences type, defaults, PREFERENCES_STORAGE_KEY, parse/load/save
│   ├── preferences.test.ts
│   └── theme-init.test.ts         key string equality with public/theme-init.js
└── ui/
    ├── app.tsx                    shell layout, skip link, <title>, live region, global keydown listener
    ├── preferences-context.tsx    PreferencesProvider + usePreferences (changePreferences, resetSettings) (R4)
    ├── shortcuts.ts               SHORTCUTS, matchShortcut, formatModifier, POINTER_GESTURES (R9)
    ├── shortcuts.test.ts
    ├── shortcut-actions.ts        getShortcutAction: ShortcutId → preference changes / dialog
    ├── shortcut-actions.test.ts
    ├── workspaces.ts              WORKSPACES table (id, label, kind), isCanvasWorkspaceId
    ├── components/                design-system primitives
    │   ├── button.tsx             variants, sizes, aria-disabled, hint tooltip, Escape dismissal
    │   ├── icon-button.tsx        required label, hint, isPressed
    │   ├── tooltip.tsx            CSS reveal, role=tooltip, group-data-tooltip-dismissed:hidden (R11)
    │   ├── dialog.tsx             native <dialog>, <h2> title, backdrop listener in effect (R8)
    │   ├── field.tsx              label + description + error
    │   ├── switch.tsx             role=switch
    │   ├── radio-group.tsx        theme picker, tool picker; aria-disabled items, hint
    │   ├── badge.tsx
    │   ├── empty-state.tsx
    │   ├── kbd.tsx
    │   ├── floating-panel.tsx     <button> handle, draft over stored, derived clamp (R7)
    │   ├── panel-position.ts      clampPanelPosition, panelPositionForKey
    │   ├── panel-position.test.ts
    │   └── icons/                 inline SVG icons, one file each
    ├── shell/
    │   ├── tab-bar.tsx            workspaces + badges + settings/help footer
    │   ├── project-bar.tsx        name, status (plain text), unavailable actions
    │   ├── issues-panel.tsx       <h2>Problems</h2>, list / "No problems"
    │   ├── issues-toggle.tsx      "Problems (N)" button, aria-expanded/aria-controls
    │   ├── placeholder-footer.tsx IssuesToggle footer for Firmware / Export
    │   ├── workspace-issue.ts     WorkspaceIssue type, NO_ISSUES, ISSUES_PANEL_ID
    │   ├── settings-dialog.tsx    theme, grid size, switches, reset, storage notice
    │   ├── grid-size-field.tsx    preset select + text field with draft
    │   ├── grid-size.ts           GRID_PRESETS_U, parseGridSizeInput
    │   ├── grid-size.test.ts
    │   └── shortcut-help-dialog.tsx
    ├── canvas/
    │   ├── work-surface.tsx       <svg role=application data-canvas-workspace>, pan/zoom (draft over stored, R15), pointer readout, renders StatusBar
    │   ├── grid-pattern.tsx       <pattern> grid, minor/major lines
    │   ├── surface-controls.tsx   snap toggle + zoom in/out/reset, top-right
    │   ├── viewport.ts            PX_PER_U, zoomAt, screenToWorld, resetViewport, panViewportByU, displayGridStep
    │   ├── viewport.test.ts
    │   ├── snap.ts                snapToGrid
    │   ├── snap.test.ts
    │   ├── rulers.tsx
    │   ├── minimap.tsx
    │   └── status-bar.tsx         position, zoom, snap, grid size, IssuesToggle
    ├── schematic/
    │   ├── schematic-workspace.tsx  work surface + tool window
    │   ├── tool-window.tsx
    │   └── tools.ts                 TOOLS table
    ├── bindings/bindings-workspace.tsx
    ├── firmware/firmware-workspace.tsx   empty state + placeholder footer
    └── export/export-workspace.tsx       empty state + placeholder footer
```

Config and doc files changed by this feature (tasks T002–T004):
- `.oxlintrc.json`:
  - workspace-folder regex `(schematic|bindings|firmware|export)`, messages say "workspace folder";
  - `ui/components/` may not import `storage/`, `canvas/`, `shell/` or `preferences-context`;
  - `react/only-export-components` allows `usePreferences`, `useProject`;
  - `jsx-a11y/no-noninteractive-tabindex` roles `tabpanel`, `application`;
  - `style` override for `floating-panel.tsx`;
  - `public/theme-init.js` lints clean by construction (R2, R14).
- `package.json`: add `zod`.
- `docs/guidelines/frontend/react.md`:
  - allowed contexts become `ProjectProvider` + `PreferencesProvider`;
  - the example folders become workspace folders;
  - the effects table gains the theme sync, `ResizeObserver`, wheel listener, dialog backdrop listener and the global `keydown`;
  - canvas-scoped keys are matched by the global listener via `data-canvas-workspace`, not `onKeyDown` on the canvas (R9).
- `docs/guidelines/frontend/admin-ui.md`: the app shell matches `contracts/ui-regions.md`; the URL-hash decision is closed per R10; keyboard shortcuts match R9.
- `docs/guidelines/frontend/accessibility.md`: shortcut line matches R9; one shell status region (project-bar status is plain text); reflow keeps the tab bar as an icon column.
- `docs/guidelines/frontend/tailwind.md`: layout keeps the tab bar as an icon column under 1024 px instead of stacking. The theme mechanism (and ADR 0011) was already updated during planning.

**Structure Decision**: Single static web app, layered per AGENTS.md §3.1. This feature touches only `storage/` (preferences) and `ui/`; `domain/`, `catalog/` and `generators/` are not created yet. `ui/canvas/` and `ui/shell/` are shared UI folders; workspace folders (`schematic/`, `bindings/`, `firmware/`, `export/`) import from them but never from each other (lint-enforced).

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Second React context (`PreferencesProvider`) beyond react.md's "one context" | Preferences are read by the tab bar, settings, both canvases, rulers, minimap, status bar and shortcuts: more than 2 prop levels. This is not project data, so it does not belong in the future project store | Prop drilling breaks the 2-level rule. A module-level external store is global mutable state that is harder to reset in tests. The guideline is amended in this feature |
| `style` prop allowed in `floating-panel.tsx` only (lint override) | The tool window position is dynamic px coordinates with no token or class equivalent | A ref and effect writing `el.style` is the same CSSOM write with more code. SVG `foreignObject` breaks focus and layout. React's `style` uses CSSOM, which CSP allows (R7) and which is verified in the quickstart production check |
| Canvas-scoped keys via the global `keydown` listener (`data-canvas-workspace`), not `onKeyDown` on the canvas; react.md amended in T003 | `onKeyDown` on `<svg role="application">` fails jsx-a11y `no-noninteractive-element-interactions`; one listener also keeps the global and canvas shortcuts in one tested matcher | A wrapper `<div>` with `onKeyDown` moves focus off the `role="application"` element and still fails the rule; a lint disable hides the a11y check instead of satisfying it |
| Plain JS file `public/theme-init.js` outside the TS pipeline | Must run before the deferred module entry to prevent a theme flash (FR-022) | An inline script needs `'unsafe-inline'` or a CSP hash; hiding the page until mount is a visible blank delay |

## Firmware overflow repair (2026-10-25)

Establish main as the containing block for absolutely positioned screen-reader descriptions, preventing their overflow from escaping to the document. Repair shell sizing in `src/ui/app/components/app.tsx`, preserving main as the scroll owner and existing semantic tokens/landmarks. Reproduce first with real wheel input over navigation in `tests/e2e/firmware.spec.ts`; verify 1024/1440px, bottom settings and empty search. Context: workflow, architecture, folder structure, tooling, domain model, TypeScript/control flow/naming, React, accessibility, admin UI, Tailwind, testing/commands. Evidence: [overflow verification](firmware-overflow-verification.md).

## Favicon repair

FR-041: declare public/favicon.svg in index.html. Reproduce the missing declaration in production Playwright before implementation; check same-origin SVG delivery and rendered icon. Work on user-requested fix/pre-major-sweep. No dependencies or ZMK changes. Evidence: firmware-overflow-verification.md.
