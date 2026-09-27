---

description: "Task list for 001-app-shell-ui"
---

# Tasks: Application Shell and Workspaces

**Input**: Design documents from `/specs/001-app-shell-ui/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Included. AGENTS.md §8 and the constitution require tests before the code for non-trivial logic. Research R13 lists the unit tests: pure functions only, Vitest in the node environment, files colocated as `*.test.ts`. The UI itself is checked manually with `quickstart.md`.

**Organization**: Tasks are grouped by user story. Phases follow spec priority: P1 (US1, US2, US3) → P2 (US4, US6, US7) → P3 (US5, US8, US9).

**Rules that apply to every task**:
- Follow `docs/guidelines/code-quality/*` and `docs/guidelines/frontend/*`.
- Use only semantic token classes: no raw palette colors, no arbitrary values, no `dark:`/`sm:`/`md:`.
- Named exports, kebab-case files, one exported concept per file.
- No `console`, no `as` (except `as const`), no `!`.
- Glossary: code says `issue` (`WorkspaceIssue`), never `problem`; UI copy "Problems" stays.
- Forwarded callbacks are wrapped in `handleX` functions, also for local variables (`react/jsx-handler-names` with `checkLocalVariables`): `onClick={handleSettingsClick}`, not `onClick={onSettingsClick}` passed through a renamed local.
- No void-returning arrow shorthands in JSX (`onClick={() => setIsOpen(true)}`); use a `handleX` function or braces (`typescript/no-confusing-void-expression`).
- Event parameters are named `event`, never `e` (`id-length`).
- Global listeners use `globalThis.addEventListener`, not `window` (`unicorn/prefer-global-this`).
- Effects never `return undefined`; return a cleanup function or nothing (`unicorn/no-useless-undefined`).
- No `setState` inside an effect body and no props→state copies (React Compiler `set-state-in-effect`, `no-deriving-state-in-effects`). Use the draft-over-stored pattern (research R15): a local draft that is `undefined` outside a gesture or edit, rendered as `draft ?? stored`. State set from an observer or listener callback (not the effect body) is allowed.
- A listener that needs current props or state is a `useEffectEvent` function; its effect subscribes once and has no changing dependencies.
- Functions and components ≤ 40 lines (`max-lines-per-function`); use the file splits named in the tasks (`grid-pattern.tsx`, `surface-controls.tsx`, `grid-size-field.tsx`, `issues-toggle.tsx`, `placeholder-footer.tsx`, `shortcut-actions.ts`).
- `npm run check` must pass at every checkpoint.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: User story from spec.md (US1–US9)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: dependencies, lint boundaries and guideline amendments needed by the plan.

- [X] T001 Add runtime dependency `zod` (latest 4.x) with `npm install zod`, then run `make install` so the Docker `node_modules` volume matches; commit `package.json` and `package-lock.json`
- [X] T002 Update `.oxlintrc.json` (research R14, R7):
  - change both step-folder regexes `(^|/)(layout|wiring|keymap|settings|export)/` to `(^|/)(schematic|bindings|firmware|export)/`; reword the messages to "workspace folder" ("ui/components/ must not import a workspace folder, and a workspace folder must not import another workspace folder; move shared pieces to ui/shell/ or ui/canvas/");
  - in the `src/ui/components/**` override also block `(^|/)(storage|canvas|shell)(/|$)` and `preferences-context` (message: "ui/components/ primitives take strings, numbers and callbacks; they do not read preferences or import workspace folders");
  - set `"react/only-export-components": ["error", { "allowExportNames": ["usePreferences", "useProject"] }]`;
  - set `"jsx-a11y/no-noninteractive-tabindex": ["error", { "tags": ["pre"], "roles": ["tabpanel", "application"] }]` (the canvas `<svg role="application" tabIndex={0}>`);
  - add an override for `src/ui/components/floating-panel.tsx` only that turns `react/forbid-dom-props` off, with reason "dynamic px position, CSSOM is CSP-safe (spec 001 R7)";
  - `public/theme-init.js` is linted with the type-aware rules; `no-empty` and `typescript/no-unsafe-*` would fire on a naive script. T009 avoids them (no `JSON.parse`, commented `catch`), so no override is planned. Only if a rule still fires, add a file override for `public/theme-init.js` naming exactly those rules and why;
  - verify with temporary probes, then delete them: `src/ui/schematic/probe.ts` importing `../bindings/x` and `src/ui/components/probe.ts` importing `../shell/x` must both be flagged.
- [X] T003 [P] Amend `docs/guidelines/frontend/react.md` (Complexity Tracking rows 1 and 3):
  - allowed contexts are exactly `ProjectProvider` and `PreferencesProvider`;
  - the folder example uses the workspace folders `schematic/`, `bindings/`, `firmware/`, `export/`, plus the shared `shell/` and `canvas/`, instead of step folders;
  - add rows to the "Effects" table, each with its file:
    - `document.documentElement.dataset.theme` sync — `preferences-context.tsx`;
    - `ResizeObserver` — `components/floating-panel.tsx` (panel and container sizes into state from the observer callback; clamp derived in render) and `canvas/work-surface.tsx` (surface size for zoom center, reported by `onSizeChange`);
    - non-passive `wheel` listener (Ctrl/Cmd zoom `preventDefault`, wheel pan; 200 ms commit timer cleared in cleanup) — `canvas/work-surface.tsx`;
    - `showModal()` / `close()` plus a backdrop `click` listener added with `addEventListener` in the same effect and removed in its cleanup (no JSX `onClick` on `<dialog>`, which fails jsx-a11y) — `components/dialog.tsx`;
    - global `keydown` on `globalThis` for all shortcuts (Alt+Shift globals and canvas-scoped single keys) — `app.tsx`. This row replaces the Ctrl/Cmd-only row; undo/redo join it when the project feature lands;
  - replace "Canvas- or table-scoped keys (arrows, Delete) use `onKeyDown` on that element, not a `document` listener" with: "Canvas-scoped single keys are matched by the one `globalThis` `keydown` listener in `app.tsx` when `event.target` is inside `[data-canvas-workspace]` (`onKeyDown` on `role="application"` fails jsx-a11y `no-noninteractive-element-interactions`). Keys of interactive elements (a `<button>` drag handle, a table selection column) use `onKeyDown` on that element."
- [X] T004 [P] Amend `docs/guidelines/frontend/admin-ui.md`, `docs/guidelines/frontend/accessibility.md` and `docs/guidelines/frontend/tailwind.md`:
  - admin-ui.md "App shell" matches `specs/001-app-shell-ui/contracts/ui-regions.md`: a left tab bar with 4 workspaces and settings plus help in its footer; a project bar, a status bar, a problems panel; replace "step nav with per-step validation badge" with workspace tabs and issue badges; replace "Hash URL vs in-memory step state is an open decision" with "Active workspace is a preference restored on reload; no URL hash (spec 001 research R10)";
  - admin-ui.md "Keyboard shortcuts" and accessibility.md "Keyboard" shortcut line: global shortcuts use Alt+Shift+key matched by `KeyboardEvent.code` (Alt+Shift+1..4, `,`, P, /); single keys work only while their widget has focus (canvas: `s`, `g`, `=`/`+`, `-`, `0`, arrows, `?`; WCAG 2.1.4); Mod+Z / Mod+Shift+Z stay the planned undo/redo; list in `specs/001-app-shell-ui/contracts/shortcuts.md`;
  - accessibility.md "Live announcements": the single polite `role="status"` region in the shell (`app.tsx`) announces status changes, including the issue total; the project-bar save status is plain text, not a second status region;
  - tailwind.md "Layout and responsiveness" and accessibility.md "Reflow and zoom": replace "shell stacks vertically under 1024px" with "the tab bar stays as a narrow icon column (labels in tooltips); `lg:` widens it and shows labels; `<main>` scrolls (`min-w-0 overflow-auto`)".

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: theme tokens, preferences store, primitives and the app frame that every story renders into.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T005 Rewrite the color tokens in `src/styles.css` (research R1):
  - Every `--color-*` in `@theme` becomes `light-dark(<current light value>, <current dark value>)`. Keep the current hex values from the existing light block and `@media (prefers-color-scheme: dark)` block, then delete the media block.
  - Add `:root { color-scheme: light dark }`, `:root[data-theme='light'] { color-scheme: light }` and `:root[data-theme='dark'] { color-scheme: dark }`.
  - No base-layer `* { transition: none }` rule: every transition is written as `motion-safe:`, which covers FR-033.
  - Keep `body { @apply bg-surface font-sans text-sm text-text; }`.
  - Keep the header comment, updated to describe `light-dark()`.
- [X] T006 [P] Write failing tests in `src/storage/preferences.test.ts`, following `contracts/preferences-storage.md` "Read behavior":
  - `parsePreferences(null)` → defaults with status `missing`;
  - valid v1 → parsed with status `ok`;
  - `{"version":1,"theme":"dark","gridSizeU":"huge"}` → theme `dark`, `gridSizeU` `0.25`, status `ok`;
  - `gridSizeU: 3` → `0.25`, because the rule is "`0.05 ≤ x ≤ 2`";
  - `'{broken'` → defaults with status `corrupt`;
  - `'[]'` (not an object) → defaults with status `corrupt`;
  - `{"version":99}` → defaults with status `corrupt`;
  - `activeWorkspaceId: "layout"` → `'schematic'`;
  - viewport `zoom: 10` → default viewport, because the rule is "`0.25 ≤ zoom ≤ 4`";
  - `loadPreferences()` with `vi.stubGlobal('localStorage', …)` whose `getItem` throws → defaults with status `unavailable`;
  - `savePreferences(DEFAULT_PREFERENCES)` returns `false` when `setItem` throws, and `true` otherwise.
- [X] T007 Implement `src/storage/preferences.ts` to pass T006:
  - Exports: `PREFERENCES_STORAGE_KEY = 'zmk-customizer:preferences'`, the `Preferences` type, `DEFAULT_PREFERENCES`, `PreferencesLoadStatus` (`'ok' | 'missing' | 'corrupt' | 'unavailable'`), `WorkspaceId`, `CanvasWorkspaceId`, `Viewport`, `DEFAULT_VIEWPORT`, `ToolWindowState`.
  - Functions: `parsePreferences`, `loadPreferences(): { preferences, status }` (wraps `localStorage.getItem` in try/catch; a throw gives `unavailable`), `savePreferences(preferences): boolean` (try/catch; `false` on failure, never throws).
  - The zod schema uses per-field `.catch(default)`. Declare the types first, then check the schema against them with `satisfies z.ZodType<Preferences>` (typescript.md).
  - Fields and defaults are exactly as in `data-model.md` "Preferences".
- [X] T008 [P] Write `src/storage/theme-init.test.ts`. Load the script as text with `import themeInitSource from '../../public/theme-init.js?raw'`. The `?raw` type comes from `vite/client`, which is already in tsconfig `types`. Do not use `node:fs`: `@types/node` is not installed and adding it is not allowed. Assert that `themeInitSource.includes(PREFERENCES_STORAGE_KEY)`. Run it: it fails first because the file is missing.
- [X] T009 Create `public/theme-init.js` to pass T008 (research R2):
  - a plain script: `try { const raw = localStorage.getItem('zmk-customizer:preferences') ?? ''; const match = /"theme":"(light|dark)"/.exec(raw); if (match) { document.documentElement.dataset.theme = match[1]; } } catch { /* storage blocked: fall back to System */ }`;
  - no `JSON.parse`: the regex avoids the `typescript/no-unsafe-*` rules on an `any` result; the comment in `catch` satisfies `no-empty`;
  - it never throws.
  
  In `index.html`, add `<script src="/theme-init.js"></script>` in `<head>`, before any stylesheet or module script.
- [X] T010 Implement `src/ui/preferences-context.tsx` (research R4):
  - `PreferencesProvider` initialises once with lazy `useState(loadPreferences)`.
  - `usePreferences()` returns `{ preferences, storageStatus, changePreferences, resetPreferences }`. `changePreferences(changes: Partial<Preferences>)` merges, calls `savePreferences`, and sets `storageStatus` to `unavailable` if saving fails. `resetPreferences()` restores `DEFAULT_PREFERENCES` and saves.
  - Loading never writes (FR-029).
  - One effect syncs `document.documentElement.dataset.theme`: `'light'`/`'dark'` set it, `'system'` deletes it.
  - Render `<PreferencesContext value={…}>`, not `.Provider`; read it with `use(PreferencesContext)`.
- [X] T011 [P] Create `src/ui/workspaces.ts` with `WORKSPACES` as a const table `{ id, label, kind: 'canvas' | 'placeholder' }` in the order schematic, bindings, firmware, export, matching `data-model.md` "WorkspaceId", and `isCanvasWorkspaceId(value: string): value is CanvasWorkspaceId` (used by T069 to validate `data-canvas-workspace`).
- [X] T012 [P] Create inline SVG icon components in `src/ui/components/icons/`, one file each, `aria-hidden="true"`, `currentColor` stroke: `schematic-icon.tsx`, `bindings-icon.tsx`, `firmware-icon.tsx`, `export-icon.tsx`, `settings-icon.tsx`, `help-icon.tsx`, `close-icon.tsx`, `select-icon.tsx`, `add-key-icon.tsx`, `wire-icon.tsx`, `magnet-icon.tsx` (snap), `plus-icon.tsx`, `minus-icon.tsx`, `reset-view-icon.tsx`, `chevron-icon.tsx`
- [X] T013 [P] Create `src/ui/components/tooltip.tsx` (research R11): a CSS-only reveal on `group-hover:` / `group-focus-visible:`, hidden by `group-data-tooltip-dismissed:hidden` (WCAG 1.4.13), `role="tooltip"` with an `id` for `aria-describedby`, token colors, `motion-safe:` transitions only.
- [X] T014 Create `src/ui/components/button.tsx` on top of `tooltip.tsx`:
  - variants `primary | secondary | ghost | danger` and sizes `sm | md` as typed `Record` maps; `type="button"` by default; visible `focus-visible:` ring with the `focus` token; `className` only for placement (tailwind.md);
  - `aria-disabled` support that swallows clicks (research R11);
  - optional `hint` renders a `Tooltip` linked by `aria-describedby`; the button is the tooltip's `group`;
  - Escape while focused sets `data-tooltip-dismissed` (local `isTooltipDismissed` state from `onKeyDown`); `onBlur` and `onPointerLeave` clear it.
- [X] T015 Create `src/ui/components/icon-button.tsx` on top of `button.tsx`:
  - `label` is required and becomes `aria-label`;
  - `hint` is passed through to `Button` (tooltip and Escape dismissal live there once);
  - optional `isPressed` renders `aria-pressed`;
  - size `size-8`.
- [X] T016 [P] Create `src/ui/components/dialog.tsx` on native `<dialog>` (research R8):
  - props `isOpen`, `onClose`, `title`, `children`;
  - one effect calls `showModal()`/`close()` to match `isOpen`, adds a `click` listener with `addEventListener` that calls `onClose` when `event.target` is the dialog element (backdrop), and removes it in cleanup. No JSX `onClick` on `<dialog>`;
  - `onClose` also fires on the native `close` event (Escape) and from a header close icon-button;
  - the title is an `<h2>` referenced by `aria-labelledby`;
  - `no-autofocus` is allowed here by the existing lint override.
- [X] T017 [P] Create `src/ui/components/empty-state.tsx`: a heading plus one sentence of description.
- [X] T018 Create `src/ui/app.tsx`, the shell layout from `contracts/ui-regions.md`. It renders only the shell and the heading:
  - a "Skip to main content" link as the first focusable element (`sr-only focus:not-sr-only`, `href="#main"`);
  - a grid with a left tab-bar column (placeholder `<nav aria-label="Workspaces">` until T021), a header slot, and `<main id="main">` with a focusable `<h1 tabIndex={-1}>` showing the active workspace label;
  - responsive rule (FR-032, edge case "viewport narrower"): the tab bar column is always visible. Unprefixed, it is a narrow icon column with the labels in tooltips; `lg:` (≥ 1024 px) widens it and shows the labels. `<main>` is `min-w-0 overflow-auto`, so below 1024 px the work area scrolls instead of overlapping, and the settings/help buttons stay reachable. There is no stacked layout (tailwind.md is amended in T004).
  
  Update `src/main.tsx` to render `<StrictMode><PreferencesProvider><App /></PreferencesProvider></StrictMode>`.

**Checkpoint**: `npm run check` passes; the app renders a shell in light or dark following the OS; T006 and T008 are green.

---

## Phase 3: User Story 1 - Switch between workspaces (Priority: P1) 🎯 MVP

**Goal**: a left tab bar switches between Schematic, Bindings, Firmware and Export; the choice is restored after reload.

**Independent Test**: `quickstart.md` rows 1–3.

- [X] T019 [P] [US1] Create `src/ui/firmware/firmware-workspace.tsx`: an `EmptyState` with the text "ZMK settings for your keyboard will appear here."
- [X] T020 [P] [US1] Create `src/ui/export/export-workspace.tsx`: an `EmptyState` with the text "Generated ZMK files and the download will appear here."
- [X] T021 [US1] Create `src/ui/shell/tab-bar.tsx`:
  - `<nav aria-label="Workspaces">` along the left edge, with one button per `WORKSPACES` entry: icon plus label `sr-only lg:not-sr-only`, and a `Tooltip` with the label that is `lg:hidden`;
  - each tab has an explicit `aria-label` (the label now; T056 adds the badge text);
  - the current tab has `aria-current="page"` and is styled with `aria-[current=page]:` (FR-002, FR-003);
  - activating a tab calls `handleTabClick(workspaceId)` → `changePreferences({ activeWorkspaceId })`;
  - a footer separated from the tabs holds a Settings icon-button (`label="Settings"`, FR-006) and a Help icon-button (`label="Keyboard shortcuts"`). Their `onSettingsClick` / `onHelpClick` props are wired by US3 and US8.
- [X] T022 [P] [US1] Create temporary canvas workspace bodies `src/ui/schematic/schematic-workspace.tsx` and `src/ui/bindings/bindings-workspace.tsx`. Each is a full-size `<div>` region labelled "<Label> canvas"; US2 replaces the body with `WorkSurface`.
- [X] T023 [US1] Wire `src/ui/app.tsx`:
  - render `TabBar`;
  - map ids to components with `const WORKSPACE_VIEWS: Record<WorkspaceId, () => ReactNode>` (no `assertNever`; `domain/` does not exist);
  - render `<title>{label} — ZMK Customizer</title>` for the active workspace (React 19 hoists it);
  - `previousWorkspaceRef = useRef(activeWorkspaceId)`; in an effect, focus the `<h1>` only when `activeWorkspaceId` differs from the ref, then update the ref (StrictMode-safe; US1 scenario 5);
  - the first visit opens Schematic (default from T007).

**Checkpoint**: US1 works alone: 4 tabs, current one marked, reload keeps the workspace, fully keyboard operable.

---

## Phase 4: User Story 2 - Work surface with a configurable grid and snapping (Priority: P1)

**Goal**: both canvas workspaces show an SVG grid in key units; the pointer readout snaps to the grid when snapping is on; a snap toggle sits on the surface.

**Independent Test**: `quickstart.md` rows 4, 5, 7.

- [X] T024 [P] [US2] Write failing tests in `src/ui/canvas/snap.test.ts` for `snapToGrid(valueU, gridU)`:
  - `snapToGrid(0.37, 0.25) === 0.25`;
  - `snapToGrid(0.38, 0.25) === 0.5`;
  - `snapToGrid(0.3, 0.1) === 0.3`, exact with no float noise;
  - negatives: `snapToGrid(-0.13, 0.25) === -0.25`;
  - a property check over 1000 values with gridU 0.05: `result / gridU` is an integer within 1e-9.
- [X] T025 [US2] Implement `src/ui/canvas/snap.ts`: `snapToGrid`, which rounds to the grid and then to 4 decimals (research R6).
- [X] T026 [P] [US2] Write failing tests in `src/ui/canvas/viewport.test.ts`:
  - `screenToWorld({xPx:48,yPx:96}, DEFAULT_VIEWPORT)` → `{xU:1,yU:2}`;
  - with `zoom:2, panXPx:10` → `xU = (48-10)/96`;
  - `displayGridStep(0.25, 1) === 0.25` (12 px);
  - `displayGridStep(0.05, 1) === 0.2`, because the step doubles until it is at least 6 px on screen (0.05→0.1→0.2);
  - `displayGridStep(0.05, 0.25)` is ≥ 6 px on screen.
- [X] T027 [US2] Implement `src/ui/canvas/viewport.ts`: `PX_PER_U = 48`, `screenToWorld(pointPx, viewport)` and `displayGridStep(gridSizeU, zoom)` (data-model.md "Viewport", research R5). Import the `Viewport` type and `DEFAULT_VIEWPORT` from `src/storage/preferences.ts`.
- [X] T028 [P] [US2] Create `src/ui/canvas/grid-pattern.tsx`: the `<defs><pattern>` plus filling `<rect>`, minor lines at `displayGridStep(gridSizeU, zoom)` with `stroke-border`, major lines every 1u with `stroke-border-strong`; renders nothing when `isGridVisible` is false (FR-010).
- [X] T029 [US2] Create `src/ui/canvas/status-bar.tsx` (first version): a `<footer>` showing the position `x, y` in u with up to 3 decimals, or `—` when undefined (FR-011). US6 and US7 extend it.
- [X] T030 [US2] Create `src/ui/canvas/work-surface.tsx` (props `workspaceId: CanvasWorkspaceId`, `children`):
  - the `<svg>` itself carries `role="application" tabIndex={0} aria-label="<Workspace> canvas" data-canvas-workspace={workspaceId}` and fills the container; focus ring via `focus-visible:` classes;
  - renders `GridPattern` and a content `<g transform>` from `preferences.viewByWorkspace[workspaceId]`;
  - pointer readout as local state `{ xU, yU } | undefined`: `handlePointerMove` → `screenToWorld`, then `snapToGrid` on both axes when `isSnapEnabled`; `handlePointerLeave` → `undefined`;
  - renders `StatusBar` itself below the surface, because it owns the readout and (from US5) the draft zoom; there is no `footer` slot;
  - a `children` slot for overlays (tool window, minimap).
- [X] T031 [US2] Create `src/ui/canvas/surface-controls.tsx`: the top-right control cluster, rendered by `WorkSurface`. First item: the snap toggle, an `IconButton` with `magnet-icon`, `label="Snap to grid"`, `isPressed={isSnapEnabled}`, `handleSnapClick` → `changePreferences({ isSnapEnabled: !isSnapEnabled })` (FR-013a). The top-left belongs to the tool window's default position and the bottom-right to the minimap; the zoom buttons from T062 join this cluster.
- [X] T032 [US2] Use `WorkSurface` in `src/ui/schematic/schematic-workspace.tsx` and `src/ui/bindings/bindings-workspace.tsx`, passing the workspace id so each uses its own viewport and both share the grid settings (FR-012).

**Checkpoint**: US2 works: grid visible in both canvases, readout snaps, the snap toggle flips it.

---

## Phase 5: User Story 3 - Settings window and themes (Priority: P1)

**Goal**: the settings dialog at the bottom of the tab bar controls theme and shared grid settings; changes apply immediately and survive reloads.

**Independent Test**: `quickstart.md` rows 6, 8–12, 25–28.

- [X] T033 [P] [US3] Write failing tests in `src/ui/shell/grid-size.test.ts` for `parseGridSizeInput(text): { ok: true, value } | { ok: false, message }`:
  - `'0.1'` is accepted;
  - `'0.05'` and `'2'` are accepted (inclusive bounds);
  - `'0.04'`, `'3'`, `''` and `'abc'` are rejected with the message "Enter a grid size from 0.05u to 2u";
  - `'0,25'` (comma decimal) is accepted as 0.25;
  - `GRID_PRESETS_U` equals `[1, 0.5, 0.25, 0.125]`.
- [X] T034 [US3] Implement `src/ui/shell/grid-size.ts`: `GRID_SIZE_MIN_U = 0.05`, `GRID_SIZE_MAX_U = 2`, `GRID_PRESETS_U`, `parseGridSizeInput` (FR-008, FR-016).
- [X] T035 [P] [US3] Create `src/ui/components/field.tsx`:
  - label, optional description and error text wired with `htmlFor`, `aria-describedby` and `aria-invalid`;
  - inputs use `border-border-strong`, because the border is the input's only edge (accessibility.md).
- [X] T036 [P] [US3] Create `src/ui/components/switch.tsx`: a `<button role="switch" aria-checked>` with a visible label, focus ring and `aria-checked:` styling.
- [X] T037 [P] [US3] Create `src/ui/components/radio-group.tsx`:
  - a `role="radiogroup"` with a label and `role="radio"` items using roving tabindex (arrow keys move focus and select);
  - items support `isDisabled`, rendered as `aria-disabled`: arrowing onto a disabled item moves focus to it but keeps the current selection (needed by US4 tools);
  - items support an optional `hint`, rendered as a `Tooltip` linked by `aria-describedby`, with the same Escape dismissal as `Button`.
- [X] T038 [US3] Create `src/ui/shell/grid-size-field.tsx`:
  - a preset `<select>` (`GRID_PRESETS_U` plus "Custom") and a `Field` with `<input type="text" inputMode="decimal">` in u;
  - draft `string | undefined` in local state, rendered as `draft ?? String(gridSizeU)`; cleared on commit, on Escape and on preset change;
  - commit on blur or Enter through `parseGridSizeInput`: valid → `changePreferences({ gridSizeU })`; invalid → the error shows and the previous value stays (FR-016);
  - Escape: when the draft is dirty, `event.preventDefault()` in `onKeyDown` (the dialog stays open) and revert; otherwise let the dialog close.
- [X] T039 [US3] Create `src/ui/shell/settings-dialog.tsx`, using `Dialog` titled "Settings", with these controls:
  - **Theme**: `RadioGroup` System / Light / Dark bound to `preferences.theme`.
  - **Grid size**: `GridSizeField`.
  - **Switches**: "Show grid" and "Snap to grid".
  - **"Reset to defaults"** button calling `resetPreferences()` (FR-018).
  - **Storage notice**: when `storageStatus === 'unavailable'`, a notice reads "Settings can't be saved in this browser and will reset when you close the tab." (FR-030).
  
  Every change calls `changePreferences` immediately; there is no save button (FR-015).
- [X] T040 [US3] Wire `src/ui/app.tsx`: local `isSettingsOpen` state; `handleSettingsClick` opens `SettingsDialog`; `handleSettingsClose` closes it. The browser returns focus to the button after `showModal` closes; verify this and restore it explicitly if it does not (FR-017).

**Checkpoint**: MVP (US1–US3) is complete. Theme switches instantly with no flash on reload (row 9); settings persist; corrupt storage opens with defaults (rows 25–27).

---

## Phase 6: User Story 4 - Floating tool window in Schematic (Priority: P2)

**Goal**: a movable, collapsible, clamped tool window with Select available and upcoming tools shown as unavailable. It exists in Schematic only.

**Independent Test**: `quickstart.md` rows 13–16.

- [X] T041 [P] [US4] Write failing tests in `src/ui/components/panel-position.test.ts`:
  - `clampPanelPosition({xPx,yPx}, {widthPx,heightPx}, {widthPx,heightPx})`: a position inside is unchanged; `x` past the right edge → `container - panel`; a negative `x`/`y` → `0`; a panel larger than the container → `0` (data-model.md "ToolWindowState");
  - `panelPositionForKey(position, key, isShift)`: `ArrowRight` → `xPx + 16`, `ArrowUp` with Shift → `yPx - 64`, `'a'` → `undefined`.
- [X] T042 [US4] Implement `src/ui/components/panel-position.ts`: `clampPanelPosition` and `panelPositionForKey` (16 px, 64 px with Shift). It sits next to its only user, `floating-panel.tsx`, so the primitive stays self-contained.
- [X] T043 [US4] Create `src/ui/components/floating-panel.tsx` (research R7, R15):
  - absolutely positioned via `style={{ translate: \`${xPx}px ${yPx}px\` }}`, which is the only allowed `style` use (T002);
  - the title bar is a `<button type="button">` handle labelled "Move tools window, use arrow keys"; its `onKeyDown` uses `panelPositionForKey` (allowed: the handle is interactive);
  - position: props `position` (stored) and `onMoveEnd(position)`; local `draft` during a pointer drag (`setPointerCapture`) or key move; rendered position is derived in render as `clampPanelPosition(draft ?? position, panelSize, containerSize)`; commit the clamped value through `onMoveEnd` on pointerup or key release, then clear the draft; never write a clamped copy back on resize;
  - `panelSize` and `containerSize` are state set from the `ResizeObserver` callback (not the effect body); the observer is disconnected in cleanup;
  - a collapse button with `aria-expanded`; the body is hidden when collapsed.
- [X] T044 [P] [US4] Create `src/ui/schematic/tools.ts`: `TOOLS` as const `[{ id:'select', label:'Select', isAvailable:true }, { id:'add-key', label:'Add key', isAvailable:false }, { id:'wire', label:'Wire', isAvailable:false }]` with icon mapping (data-model.md "Tool").
- [X] T045 [US4] Create `src/ui/schematic/tool-window.tsx`:
  - a `FloatingPanel` titled "Tools" (`<section aria-label="Tools">`) with a `RadioGroup` of `TOOLS`;
  - active tool is local state, defaulting to `select`;
  - unavailable tools are `isDisabled` with `hint="Not available yet"`; activating them changes nothing (FR-024);
  - position and collapse come from `preferences.toolWindow` and are saved via `changePreferences({ toolWindow })` in `handleMoveEnd` and `handleCollapseToggle` (FR-027).
- [X] T046 [US4] Render `ToolWindow` inside the `WorkSurface` children slot in `src/ui/schematic/schematic-workspace.tsx` only. `bindings-workspace.tsx` stays without it (FR-023).

**Checkpoint**: US4 works: move, collapse, keyboard move, resize clamp, reload restores it; Bindings has no tool window.

---

## Phase 7: User Story 6 - Project bar and status bar (Priority: P2)

**Goal**: the project bar shows name, status and unavailable actions; the status bar shows position, zoom, snap and grid size.

**Independent Test**: `quickstart.md` rows 1 and 23, plus the status bar values in rows 4, 5 and 17.

- [X] T047 [P] [US6] Create `src/ui/shell/project-bar.tsx`, a `<header>` containing:
  - the name "Untitled keyboard";
  - save status "Nothing to save" as plain text (the shell live region from T057 is the only `role="status"`);
  - `Button`s New, Open, Save, Undo, Redo, each `aria-disabled="true"` with `hint="Not available yet"` and no effect (FR-034, research R11).
- [X] T048 [US6] Extend `src/ui/canvas/status-bar.tsx`: add zoom as an integer % (the rendered zoom, passed by `WorkSurface`), snap state ("Snap on"/"Snap off"), and grid size in u, next to the position, with `—` when the pointer is off the surface (FR-035).
- [X] T049 [US6] Render `ProjectBar` in the header slot of `src/ui/app.tsx` for every workspace.

**Checkpoint**: US6 works on top of US1–US2.

---

## Phase 8: User Story 7 - Problems panel (Priority: P2)

**Goal**: a problems panel with tab badges and a polite live total. It is empty in this feature.

**Independent Test**: `quickstart.md` row 21.

- [X] T050 [P] [US7] Create `src/ui/shell/workspace-issue.ts`: the `WorkspaceIssue` type `{ code: string; message: string; path: readonly (string | number)[]; workspaceId: WorkspaceId }` (observability.md issue shape plus `workspaceId`), `NO_ISSUES: readonly WorkspaceIssue[] = []` and `ISSUES_PANEL_ID = 'issues-panel'` (data-model.md "WorkspaceIssue", research R12).
- [X] T051 [P] [US7] Create `src/ui/components/badge.tsx`: a small count pill using the `danger` token; the parent hides it at 0.
- [X] T052 [US7] Create `src/ui/shell/issues-panel.tsx`:
  - `<section id={ISSUES_PANEL_ID} aria-labelledby>` docked below the work area, with an `<h2>Problems</h2>`;
  - shows the list (workspace label + message), or "No problems" when empty;
  - a close icon-button (`handleCloseClick` → `changePreferences({ isIssuesPanelOpen: false })`) (FR-036).
- [X] T053 [US7] Create `src/ui/shell/issues-toggle.tsx`: a `Button` "Problems (N)" with `aria-expanded={isIssuesPanelOpen}` and `aria-controls={ISSUES_PANEL_ID}`; it reads preferences and `NO_ISSUES` itself (later: `useProject().issues`), and `handleClick` flips `isIssuesPanelOpen`.
- [X] T054 [US7] Create `src/ui/shell/placeholder-footer.tsx`: a `<footer>` holding `IssuesToggle`; render it at the bottom of `src/ui/firmware/firmware-workspace.tsx` and `src/ui/export/export-workspace.tsx`, so the toggle is reachable on placeholder workspaces.
- [X] T055 [US7] Render `IssuesToggle` at the right end of `src/ui/canvas/status-bar.tsx`.
- [X] T056 [US7] Show a `Badge` per tab in `src/ui/shell/tab-bar.tsx` with the count of issues for that workspace, hidden at 0; the tab's explicit `aria-label` includes the badge text ("Schematic, 2 problems") (FR-037).
- [X] T057 [US7] Wire `src/ui/app.tsx`:
  - pass `NO_ISSUES` to `TabBar` and `IssuesPanel`;
  - render the panel when `preferences.isIssuesPanelOpen` is true and keep it across workspace switches;
  - one always-mounted, visually hidden polite live region (`role="status"`) outside the panel, rendering the total issue count ("No problems" / "2 problems"); React updates its text, so the total is announced when it changes (FR-037).

**Checkpoint**: US7 works; badges are hidden; panel state persists.

---

## Phase 9: User Story 5 - Navigate the work surface (Priority: P3)

**Goal**: zoom (25–400%) around the pointer or the center, pan by pointer and keyboard, reset view; each canvas keeps its own view.

**Independent Test**: `quickstart.md` rows 17, 18 and 24.

- [X] T058 [P] [US5] Add failing tests to `src/ui/canvas/viewport.test.ts`:
  - `zoomAt(viewport, factor, anchorPx)` keeps `screenToWorld(anchorPx)` equal before and after (`toBeCloseTo` on both axes);
  - zoom is clamped to "`0.25 ≤ zoom ≤ 4`";
  - `zoomAt` at the max zoom with `factor > 1` returns an equal viewport;
  - `resetViewport()` equals `DEFAULT_VIEWPORT`;
  - `panViewportByU(viewport, { dxU: 1, dyU: 0 })` at zoom 2 moves `panXPx` by `-96` (content moves left when panning right).
- [X] T059 [US5] Implement `zoomAt`, `resetViewport` and `panViewportByU` in `src/ui/canvas/viewport.ts`, using `ZOOM_MIN = 0.25`, `ZOOM_MAX = 4` and a zoom step factor of `1.25`.
- [X] T060 [US5] Add the draft/commit viewport state to `src/ui/canvas/work-surface.tsx` (research R15):
  - `preferences.viewByWorkspace[workspaceId]` is the only source of truth;
  - local `draftViewport: Viewport | undefined`; render `draftViewport ?? storedViewport` (content `<g>`, `GridPattern`, status-bar zoom);
  - `commitViewport(viewport)` calls `changePreferences({ viewByWorkspace: { ...viewByWorkspace, [workspaceId]: viewport } })` and clears the draft;
  - discrete actions (zoom buttons, reset, shortcuts from T069, minimap click) write the stored viewport directly; outside a gesture there is no draft, so external writes are never overwritten.
- [X] T061 [US5] Add pointer pan and zoom gestures to `src/ui/canvas/work-surface.tsx`:
  - a non-passive `wheel` listener (`{ passive: false }`) added in an effect on the `<svg>`: Ctrl/Cmd+wheel → `zoomAt` around the pointer with `preventDefault` (no browser zoom); plain wheel pans; both write the draft; a 200 ms timer after the last wheel event commits; the timer is cleared in cleanup;
  - the wheel handler is a `useEffectEvent`, so the effect subscribes once;
  - middle-button drag pans (pointer capture): the draft during the drag, commit on pointerup.
- [X] T062 [US5] Add the surface size and zoom buttons:
  - in `src/ui/canvas/work-surface.tsx`, a `ResizeObserver` on the `<svg>` sets `surfaceSize` state from its callback and calls the `onSizeChange(size)` prop (a `useEffectEvent`); disconnect in cleanup;
  - in `src/ui/canvas/surface-controls.tsx`, add zoom in / zoom out / reset view `IconButton`s next to the snap toggle; they call `zoomAt` / `resetViewport` at the surface center `{ xPx: widthPx / 2, yPx: heightPx / 2 }` and commit directly.

**Checkpoint**: US5 works; each canvas keeps its own view after reload.

---

## Phase 10: User Story 8 - Keyboard shortcuts and help (Priority: P3)

**Goal**: Alt+Shift global shortcuts and canvas-scoped single keys from `contracts/shortcuts.md`, and a help dialog generated from the same list.

**Independent Test**: `quickstart.md` rows 5, 12, 17, 22 and 24.

- [X] T063 [P] [US8] Write failing tests in `src/ui/shortcuts.test.ts` for `matchShortcut(input: { code: string; key: string; altKey: boolean; shiftKey: boolean; ctrlKey: boolean; metaKey: boolean; isTypingTarget: boolean; isDialogOpen: boolean; focusedCanvas: CanvasWorkspaceId | undefined }): ShortcutId | undefined`, using plain objects (no DOM):
  - every row of `contracts/shortcuts.md` maps its code or key to its id;
  - global: `{ code: 'Digit2', altKey: true, shiftKey: true }` → `workspace-bindings` with any `key` (macOS Option changes `key`); without Shift → `undefined`; with Ctrl or Meta added → `undefined`; `Comma` → `open-settings`, `KeyP` → `toggle-issues-panel`, `Slash` → `open-help`;
  - global shortcuts work with and without `focusedCanvas`;
  - canvas: `key: 's'` with `focusedCanvas: 'schematic'` → `toggle-snap`; `key: 'S'` → `toggle-snap`; the same without `focusedCanvas` → `undefined`;
  - canvas: `+` (Shift) and `=` → `zoom-in`; `?` (Shift) → `open-help`; `ArrowLeft` → `pan-left`, Shift+`ArrowLeft` → `pan-left-1u`;
  - canvas with Ctrl, Meta or Alt held → `undefined`;
  - `isTypingTarget: true` → `undefined` for a global and a canvas shortcut;
  - `isDialogOpen: true` → `undefined`;
  - `formatModifier(userAgent)`: a macOS Safari and a macOS Chrome UA string → `{ altLabel: 'Option', primaryLabel: 'Cmd' }`; Windows, Linux and `''` → `{ altLabel: 'Alt', primaryLabel: 'Ctrl' }` (FR-040).
- [X] T064 [US8] Implement `src/ui/shortcuts.ts`:
  - `SHORTCUTS` as const: global entries `{ id, scope: 'global', code, label }`, canvas entries `{ id, scope: 'canvas', keys, label, shift? }` (`shift` set only on arrows: `shiftKey` must equal it; other canvas entries allow Shift); `ShortcutId`;
  - `matchShortcut` with the rules of `contracts/shortcuts.md`: `undefined` when `isTypingTarget` or `isDialogOpen`; global needs `altKey && shiftKey && !ctrlKey && !metaKey` and matches `code`; canvas needs `focusedCanvas !== undefined` and no Ctrl/Meta/Alt, matches `key`, letters case-insensitive;
  - `formatModifier(userAgent: string)` using `/mac/i.test(userAgent)`;
  - a `POINTER_GESTURES` const table for the help dialog; modifier entries use a `{primary}` placeholder.
- [X] T065 [P] [US8] Write failing tests in `src/ui/shortcut-actions.test.ts` for `getShortcutAction(shortcutId, { preferences, focusedCanvas, surfaceSize })`:
  - `workspace-firmware` → `{ kind: 'change-preferences', changes: { activeWorkspaceId: 'firmware' } }`;
  - `toggle-snap` flips `isSnapEnabled`; `toggle-grid` flips `isGridVisible`; `toggle-issues-panel` flips `isIssuesPanelOpen`;
  - `zoom-in` on `focusedCanvas: 'bindings'` changes only `viewByWorkspace.bindings`, anchored at the surface center;
  - `pan-right` pans by `gridSizeU`, `pan-right-1u` by 1u (`panViewportByU`);
  - `open-settings` → `{ kind: 'open-settings' }`; `open-help` → `{ kind: 'open-help' }`.
- [X] T066 [US8] Implement `src/ui/shortcut-actions.ts`: `getShortcutAction`, a pure mapping from `ShortcutId` to a `ShortcutAction` (`change-preferences` | `open-settings` | `open-help`), so `App` stays ≤ 40 lines.
- [X] T067 [P] [US8] Create `src/ui/components/kbd.tsx`: a styled `<kbd>` element.
- [X] T068 [US8] Create `src/ui/shell/shortcut-help-dialog.tsx`: a `Dialog` titled "Keyboard shortcuts" with two tables rendered from `SHORTCUTS` (global: "Option+Shift+1" on macOS, "Alt+Shift+1" elsewhere; canvas keys, noted "while a canvas has focus") and one from `POINTER_GESTURES`, with `{primary}` → "Cmd"/"Ctrl". Labels come from `formatModifier(navigator.userAgent)` (FR-040, SC-008). Do not use User-Agent Client Hints: they do not type-check without `as`.
- [X] T069 [US8] In `src/ui/app.tsx`, add one `keydown` listener on `globalThis` in an effect that subscribes once; the handler is a `useEffectEvent`:
  - it builds the `matchShortcut` input: `isTypingTarget = event.target instanceof HTMLElement && (event.target.isContentEditable || ['INPUT','TEXTAREA','SELECT'].includes(event.target.tagName))`; `isDialogOpen = document.querySelector('dialog[open]') !== null`; `focusedCanvas` from `event.target.closest('[data-canvas-workspace]')?.getAttribute('data-canvas-workspace')`, kept only if `isCanvasWorkspaceId` (T011);
  - on a match it calls `preventDefault()` and dispatches `getShortcutAction`: `change-preferences` → `changePreferences`, `open-settings` → `setIsSettingsOpen(true)`, `open-help` → `setIsHelpOpen(true)`;
  - the surface size comes from `surfaceSizeRef` (`useRef<{ widthPx, heightPx }>`), set by `WorkSurface`'s `onSizeChange` (T062) through the canvas workspaces;
  - keep `App` ≤ 40 lines: the handler and the input builder are module-level helpers in `app.tsx`.
- [X] T070 [US8] Wire the TabBar Help button in `src/ui/app.tsx`: `handleHelpClick` opens `ShortcutHelpDialog`, `handleHelpClose` closes it.
- [ ] T071 [US8] Verify in Chrome, Firefox and Safari on macOS that none of the global combos (Alt+Shift+1..4, `,`, P, /) is swallowed by the browser or the OS and each reaches the listener. If one is, record it in `contracts/shortcuts.md`, pick another `code`, and update `SHORTCUTS` and the T063 tests.

**Checkpoint**: US8 works; typing in the grid size field never triggers shortcuts; canvas keys act only on the focused canvas.

---

## Phase 11: User Story 9 - Rulers and minimap (Priority: P3)

**Goal**: rulers in u and a minimap with a draggable viewport rectangle, each switchable in settings.

**Independent Test**: `quickstart.md` rows 4, 19 and 20.

- [X] T072 [P] [US9] Create `src/ui/canvas/rulers.tsx`:
  - two `aria-hidden` SVG strips (top, left) with ticks every `displayGridStep` and labels every 1u, following the viewport;
  - a pointer marker at the readout position;
  - hidden when `areRulersVisible` is false (FR-013b).
- [X] T073 [P] [US9] Create `src/ui/canvas/minimap.tsx`:
  - `<svg role="img" aria-label="Minimap">` in the bottom-right corner, showing the content bounds (default 20u × 8u) and the current viewport rectangle;
  - dragging the rectangle calls `onPanDraft(viewport)` during the drag and `onPanCommit(viewport)` at the end; clicking calls `onPanCommit`. `WorkSurface` wires these to its draft and commit (T060, research R15);
  - hidden when `isMinimapVisible` is false (FR-013c).
- [X] T074 [US9] Integrate `Rulers` and `Minimap` in `src/ui/canvas/work-surface.tsx`. Make sure `SurfaceControls`, the minimap and the default tool-window corner do not overlap (US9 scenario 4).
- [X] T075 [US9] Add "Show rulers" and "Show minimap" switches to `src/ui/shell/settings-dialog.tsx` (FR-014).

**Checkpoint**: all 9 stories work.

---

## Phase 12: Polish & Cross-Cutting Concerns

- [X] T076 [P] Verify contrast in both themes for every token pair in `src/styles.css`:
  - text, text-muted, accent, danger, warning, success and accent-contrast-on-accent ≥ 4.5:1;
  - focus and border-strong ≥ 3:1.
  
  Record the ratios in a comment block in `src/styles.css`; adjust tokens that fail (FR-021, SC-005).
- [X] T077 [P] Update `README.md` with a short "App layout" section: the 4 workspaces and the settings dialog, with a link to `specs/001-app-shell-ui/spec.md`.
- [ ] T078 Run every manual scenario in `specs/001-app-shell-ui/quickstart.md` (rows 1–29), the accessibility pass and the production CSP check (`make image && make prod`, no CSP violations in the console, then `make down`). Also measure SC-003 with a DevTools Performance recording of a theme switch and a workspace switch: the longest frame must be < 100 ms. Record the results at the end of `quickstart.md` as a dated "Validation log": pass or fail per row, the SC-003 measurements, and notes.
- [X] T079 Run the `spec-reviewer` agent on `specs/001-app-shell-ui/` and resolve its findings.
- [X] T080 Update `specs/001-app-shell-ui/checklists/requirements.md` notes with the implementation status.
- [X] T081 Run `make check` and `npm run build` after all code, doc and checklist changes; fix every lint, type and format error without disabling rules. The only allowed exceptions are the ones from T002.

---

## Dependencies & Execution Order

### Phase Dependencies

- Setup (Phase 1) → Foundational (Phase 2) → all stories.
- US1 (Phase 3) → every later story renders inside its shell.
- US2 (Phase 4) → US4, US5, US6 (status bar extension), US9 (all need `WorkSurface`).
- US3 (Phase 5) → US9 (adds switches to the settings dialog). US3 also builds `RadioGroup`, which US4 reuses.
- US4 depends on US2 and US3 (`RadioGroup`).
- US6 depends on US2 (status bar).
- US7 depends on US1 (tab bar) and US6 (status bar).
- US5 depends on US2.
- US8 depends on US3 (settings dialog), US5 (zoom, pan, `onSizeChange` from T062) and US7 (issues panel toggle).
- US9 depends on US2, US3 and US5 (the viewport draft/commit mechanism from T060).
- Polish runs last; T081 is the final task.

### Within Each Story

Tests → pure implementation → components → wiring in `app.tsx` or the workspace.

### Parallel Opportunities

- Phase 1: T003 ∥ T004 (docs), after T001/T002.
- Phase 2: T006, T008, T011, T012, T013, T016 and T017 can all start together. T007 needs T006; T009 needs T008; T010 needs T007; T014 needs T013; T015 needs T014; T018 needs T010.
- US1: T019 ∥ T020 ∥ T022.
- US2: T024 ∥ T026 ∥ T028.
- US3: T033 ∥ T035 ∥ T036 ∥ T037.
- US4: T041 ∥ T044.
- US6: T047 in parallel with any US7 task.
- US7: T050 ∥ T051.
- US5: T058 can start with US6/US7.
- US8: T063 ∥ T065 ∥ T067.
- US9: T072 ∥ T073.
- Polish: T076 ∥ T077.

## Parallel Example: Phase 2

```text
Task: "T006 Write failing tests in src/storage/preferences.test.ts"
Task: "T008 Write src/storage/theme-init.test.ts (fails: public/theme-init.js missing)"
Task: "T012 Create inline SVG icons in src/ui/components/icons/"
Task: "T013 Create src/ui/components/tooltip.tsx"
Task: "T016 Create src/ui/components/dialog.tsx"
Task: "T017 Create src/ui/components/empty-state.tsx"
```

## Implementation Strategy

### MVP First (US1 + US2 + US3, all P1)

1. Phase 1 → Phase 2 → US1 → US2 → US3.
2. **Stop and validate**: `quickstart.md` rows 1–12 and 25–28, then `make check`.
3. This is a shippable shell: navigation, grid, snapping, themes, settings.

### Incremental Delivery

4. US4 (tool window) → US6 (project and status bar) → US7 (problems panel). Validate after each.
5. US5 (navigation) → US8 (shortcuts) → US9 (rulers, minimap).
6. Polish phase.

## Notes

- Commit after each task or logical group, using Conventional Commits (`feat(ui): …`, `test(storage): …`, `docs: …`).
- No new dependencies beyond `zod` (T001).
- If a task seems to need a new context, `style`, an arbitrary class or a lint exception beyond T002, stop and record it. Do not add it silently.

---

## Implementation notes (2026-09-27)

Deviations from the task text, each smaller or forced by lint/type rules; code comments point back here where useful.

- **Lint config beyond T002**: `eslint/id-length` allows `z` (zod's documented `import * as z`); `unicorn/prefer-top-level-await` is off (false positive on zod's `.catch(default)`; the app has no top-level promise chains).
- **T033/T034**: the parse result is `{ isValid: true, value } | { isValid: false, message }` (boolean naming rule), not `ok`.
- **T037 RadioGroup**: native `<fieldset>` + `<input type="radio">` instead of `role="radio"` buttons (`jsx-a11y/prefer-tag-over-role`). The browser provides arrow keys and roving focus; an `aria-disabled` option takes focus and `onChange` ignores it, so the selection stays.
- **T060–T062, T069 zoom center**: no `ResizeObserver` → `onSizeChange` → `surfaceSizeRef` chain. `canvas/surface-center.ts` reads `getBoundingClientRect()` of the canvas at action time (buttons: the `svgRef`; shortcuts: the focused canvas from `event.target`). `canvas/use-element-size.ts` (a `ResizeObserver`) exists only for rulers and minimap, which render from the size.
- **T060 content group**: the `<g transform>` content layer is not rendered yet; there is no content until the layout editor (roadmap 006).
- **T073 minimap**: `aria-hidden="true"` instead of `role="img"` (`jsx-a11y/prefer-tag-over-role`); keyboard users pan with arrows on the canvas.
- **T057 live region**: `<output>` element (implicit `role="status"`) in `shell/issues-announcer.tsx`.
- **T050–T057**: `TabBar`, `IssuesPanel`, `IssuesToggle` read `NO_ISSUES` themselves (later `useProject().issues`), so no issue props are threaded through the shell.
- **Tool window default** `{ xPx: 28, yPx: 28 }` (was 16) so it clears the 20 px rulers; surface controls sit at `top-7 right-2` for the same reason.
- **Extra files** (splits for `max-lines-per-function` 40 and `import/max-dependencies` 10): `ui/workspace-view.tsx` (title, h1 focus, workspace body), `ui/use-shell-dialogs.ts`, `ui/use-global-shortcuts.ts`, `shell/workspace-tab.tsx`, `shell/issues-announcer.tsx`, `canvas/surface-overlays.tsx`, `canvas/use-surface-viewport.ts`, `canvas/surface-center.ts`, `canvas/use-element-size.ts`, `components/input-classes.ts`.
- **Button** gained a `nav` variant (tab styling via `aria-[current=page]:`) and `hintClassName` (tab tooltip `lg:hidden`).

### Review fixes (T079, spec-reviewer on the implementation)

- **M1** `changePreferences` merges into the latest state (ref updated only in handlers) and accepts an updater; a viewport draft records its `base` and is ignored once the stored view changes, and delayed wheel commits skip when the base moved. Zoom/pan buttons and shortcuts can no longer be reverted by a pending wheel gesture.
- **M2** `isTypingTarget` counts only text-entry inputs; a focused Tools radio keeps shortcuts working (contract updated).
- **M3** Tools-window handle and minimap start a drag on the primary button only and end it on `pointercancel` / `lostpointercapture`; the handle has `touch-none`.
- **M4** `resetSettings()` (was `resetPreferences()`) resets only the settings-dialog fields (FR-018). T010/T039 text above is superseded.
- **Minor**:
  - the draft lives in a ref for rapid events, and a pending wheel draft is flushed on unmount;
  - the tab tooltip is `lg:hidden!` and `aria-hidden`, because it repeats the tab name;
  - grid size allows at most 3 decimals (SC-006);
  - the dialog body mounts only while the dialog is open, and Reset remounts the grid size field;
  - the pointer readout is derived from the stored screen point;
  - closing the problems panel returns focus to the toggle;
  - held keys repeat only pan and zoom;
  - backdrop close requires the press to start on the backdrop;
  - the minimap keeps the grab offset inside the frame;
  - surface control order: snap, zoom in, zoom out, reset.

### Not done by the implementing agent

- **T071** (browser verification of Alt+Shift combos) and the interactive rows of **T078** need a real browser session; no browser automation is available here and adding one would be a new dependency. Verified instead: `make check`, `npm run build`, production image headers and CSP, `theme-init.js` served before the module entry, and the built CSS theme mechanism (LightningCSS lowers `light-dark()` to `--lightningcss-light/dark` variables, overridden by `:root[data-theme=light|dark]`).
