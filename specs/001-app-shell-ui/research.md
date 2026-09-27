# Research: Application Shell and Workspaces

Decisions for `plan.md`. Each: decision, rationale, alternatives.

## R1. Light / Dark / System themes with one set of tokens

- **Decision**: Tokens in `src/styles.css` use CSS `light-dark(<light>, <dark>)` values. `:root` has `color-scheme: light dark` (System). `:root[data-theme='light'] { color-scheme: light }` and `:root[data-theme='dark'] { color-scheme: dark }` force a theme. The app sets `document.documentElement.dataset.theme` to `light` / `dark`, or removes it for System. The existing `@media (prefers-color-scheme: dark)` block is deleted.
- **Rationale**: Every token is defined once; switching is one attribute write, which is instant (FR-020) and needs no `dark:` utilities (tailwind.md). `light-dark()` is supported by all target browsers (Chrome/Edge 123+, Firefox 120+, Safari 17.5+). System following the OS comes for free (US3 scenario 3).
- **Alternatives**: A duplicated dark block under both a media query and `[data-theme=dark]` means two copies of every dark value that drift apart. A `class="dark"` with a Tailwind `@custom-variant dark` needs `dark:` in feature code, which the guidelines ban.

## R2. No flash of the wrong theme on load (FR-022)

- **Decision**: `public/theme-init.js`, a plain script of about 10 lines, loaded with a blocking `<script src="/theme-init.js"></script>` in `<head>` before the module entry. It reads the preferences key from `localStorage`, matches `/"theme":"(light|dark)"/` against the raw string, and on a match sets `data-theme`. It does not call `JSON.parse`: the file is linted type-aware, and an `any` result would trip `typescript/no-unsafe-*`. Any error is caught (the `catch` holds a comment, for `no-empty`), which falls back to System.
- **Rationale**: The module entry is deferred, so React applies the theme after first paint and the wrong theme flashes. An inline script would need `'unsafe-inline'` or a hash in the CSP; a same-origin file passes `script-src 'self'`.
- **Alternatives**: A CSP hash for an inline script is brittle, since it changes on every edit. Hiding `body` until React mounts is a visible blank delay.
- **Consequence**: The storage key string is duplicated in `theme-init.js`. One test reads the file and asserts it contains the `PREFERENCES_STORAGE_KEY` value.

## R3. Preferences storage and parsing

- **Decision**: One `localStorage` entry `zmk-customizer:preferences` holding `{ "version": 1, ... }`. It is parsed with `zod` in `src/storage/preferences.ts`; zod is an approved dependency and is installed now. Each field uses `.catch(default)`, so one bad field falls back alone. A different `version` or invalid JSON returns all defaults with status `corrupt`. Writes happen only from user-initiated changes (`changePreferences` / `resetSettings`), never on load, so a corrupt value survives until the user changes a setting (FR-029). `localStorage` access is wrapped in `try/catch`: if it throws, status is `unavailable` and the settings dialog shows a notice (FR-030).
- **Rationale**: This is the trust boundary (constitution IV). Per-field fallback keeps valid settings when one field is damaged. Writing on user action means there is no autosave effect to guard.
- **Alternatives**: Hand-written type guards duplicate what zod does and are a common source of bugs. IndexedDB is async and overkill for a small JSON object.

## R4. Where preferences state lives

- **Decision**: `PreferencesProvider`, a second React context, in `src/ui/preferences-context.tsx`, plus a `usePreferences()` hook that returns `{ preferences, storageStatus, changePreferences, resetSettings }`. The provider initialises from `loadPreferences()` once (lazy `useState` initialiser). `changePreferences(changes)` merges, saves and sets state; `resetSettings()` restores the defaults and saves. One effect syncs `data-theme` on `<html>`.
- **Rationale**: Theme, grid, snap and views are read by the tab bar, settings dialog, work surfaces, rulers, minimap, status bar and shortcuts. That is more than 2 prop levels (react.md), and the data is not project data, so it cannot live in the future `ProjectProvider`.
- **Deviation**: react.md says the project store is the only context. This feature amends the rule to "`ProjectProvider` and `PreferencesProvider` are the only contexts". The amendment is a task in this feature. Recorded in Complexity Tracking.
- **Alternatives**: `useSyncExternalStore` over a module singleton makes a global mutable store that is harder to reset in tests. Prop drilling was rejected by the 2-level rule.

## R5. Canvas rendering: grid, rulers, minimap

- **Decision**: The work surface is an SVG. The grid is one `<pattern>` (minor lines at grid size, major lines every 1u) filling a `<rect>`, so the cost stays constant at any size. Pan and zoom are a `transform` attribute on one `<g>`. The scale is 48 px per 1u at 100% zoom, and zoom is clamped to 25–400%. When the grid step on screen falls below 6 px, the drawn step doubles until it is at least 6 px. This affects rendering only; snapping still uses the real grid size (edge case in spec). Rulers are two SVG strips whose ticks are computed from the viewport. The minimap is a small SVG showing the content bounds (default content area 20u × 8u until content exists) plus a viewport rectangle.
- **Rationale**: SVG is the approved editor technology (ADR 0008). Presentation attributes (`x`, `transform`, `width`) are not governed by CSP. A pattern keeps the DOM small.
- **Alternatives**: `<canvas>` rules out accessible SVG keys later and contradicts ADR 0008. Drawing one `<line>` per grid line creates thousands of DOM nodes at small grid sizes.

## R6. Snapping math and pointer readout

- **Decision**: Two pure functions in `src/ui/canvas/`, each with unit tests:
  - `snapToGrid(valueU, gridU)` = `Math.round(valueU / gridU) * gridU`, with float noise removed by rounding to 4 decimals.
  - `screenToWorld(point, viewport)`.
  - The readout shows `x, y` in u with up to 3 decimals. The pointer position is local state of the work surface, so a 60 Hz pointer stream does not re-render the shell.
- **Rationale**: SC-006 ("exact multiples") needs a deterministic rounding step; `0.1 + 0.2` style float noise would fail it.

## R7. Floating tool window positioning

- **Decision**: A `FloatingPanel` primitive in `src/ui/components/floating-panel.tsx`, absolutely positioned inside the surface container, with `style={{ translate: 'Xpx Ypx' }}`. The position is clamped to the container by a pure `clampPanelPosition(position, panelSize, containerSize)`, which is unit tested. The title bar is a `<button type="button">` handle: pointer drag uses pointer capture, and its `onKeyDown` moves by `panelPositionForKey(position, key, isShift)` (16 px, 64 px with Shift; pure, tested). Position follows R15: a local draft during a move, rendered as `clampPanelPosition(draft ?? stored, panelSize, containerSize)` derived in render; panel and container sizes are state set from the `ResizeObserver` callback. The clamped position is committed through `onMoveEnd` on drag end or key release; a resize never writes a clamped copy back, so the stored position returns when space allows.
- **CSP note**: React applies the `style` prop through CSSOM (`element.style`), which CSP `style-src` does not block. Only `style="..."` in HTML markup and `setAttribute('style')` are blocked. The lint ban on `style` (`react/forbid-dom-props`) stays global, with an override for `src/ui/components/floating-panel.tsx` only. The quickstart verifies this under the production CSP.
- **Alternatives**: A `ref` plus an effect writing `el.style` is the same CSSOM write with more code. SVG `foreignObject` breaks focus and layout in Safari.

## R8. Dialogs

- **Decision**: A `Dialog` primitive on native `<dialog>`: `showModal()` when open, closed on the `close` event (Escape), on a click whose target is the `<dialog>` element itself (backdrop), and by a close button. The backdrop `click` listener is added with `addEventListener` in the effect that calls `showModal()` and removed in its cleanup; a JSX `onClick` on `<dialog>` fails jsx-a11y (`no-noninteractive-element-interactions`). The title is an `<h2>`. Focus returns to the opener, which the browser does for `showModal`. It is used by the settings dialog and the shortcut help dialog.
- **Rationale**: Native focus trapping, inert background and Escape handling (FR-017, US8); no dependency (ADR 0011).

## R9. Keyboard shortcuts

- **Decision**: Two kinds, one list `SHORTCUTS` in `src/ui/shortcuts.ts` (`contracts/shortcuts.md`):
  - **Global**: Alt+Shift+key, matched by `KeyboardEvent.code`: `Digit1`–`Digit4` workspaces, `Comma` settings, `KeyP` problems panel, `Slash` help.
  - **Canvas-scoped single keys**, only while a canvas (the focused `<svg role="application">`) has focus: `s` snap, `g` grid, `=`/`+` zoom in, `-` zoom out, `0` reset view, arrows pan 1 grid step (Shift+arrows 1u), `?` help.
- **Matcher**: a pure `matchShortcut(input: { code, key, altKey, shiftKey, ctrlKey, metaKey, isTypingTarget, isDialogOpen, focusedCanvas }): ShortcutId | undefined`, tested with plain objects (no DOM). `undefined` when `isTypingTarget` or `isDialogOpen` (FR-039). Global needs `altKey && shiftKey && !ctrlKey && !metaKey`, matched by `code`. Canvas needs `focusedCanvas !== undefined` and no Ctrl/Meta/Alt; Shift is allowed; matched by `key`, letters case-insensitive.
- **Listener**: one `keydown` listener on `globalThis`, installed in `app.tsx` by an effect that subscribes once (handler is a `useEffectEvent`). It computes `isTypingTarget` (target is an `HTMLElement` that is contenteditable or an `INPUT`/`TEXTAREA`/`SELECT`), `isDialogOpen` (`document.querySelector('dialog[open]') !== null`) and `focusedCanvas` (`event.target.closest('[data-canvas-workspace]')`, validated against the canvas ids; the matched id names the canvas to act on). A pure `getShortcutAction` in `src/ui/shortcut-actions.ts` maps the id to preference changes or a dialog to open. The help dialog renders `SHORTCUTS`, so it cannot drift (SC-008).
- **Help labels**: `formatModifier(navigator.userAgent)` with `/mac/i` gives "Option" / "Cmd" on macOS and "Alt" / "Ctrl" elsewhere, so the help shows "Option+Shift+1" or "Alt+Shift+1". User-Agent Client Hints are not used: they do not type-check in TS 7 without `as`.
- **Rationale**:
  - WCAG 2.1.4 and accessibility.md forbid global single-character shortcuts; single keys are therefore scoped to the focused canvas.
  - `code`, not `key`, for globals: Option on macOS changes `event.key` (Option+Shift+1 gives `⁄`).
  - Alt+Shift, not Alt alone: Alt+digit switches browser tabs on Linux, Alt+letter opens Firefox/Windows menus. `Ctrl/Cmd+,` opens browser preferences and cannot be prevented.
  - Arrow-key pan closes the WCAG 2.1.1 gap: before, pan was pointer-only.
  - One global listener instead of `onKeyDown` on the canvas: `onKeyDown` on `role="application"` fails jsx-a11y `no-noninteractive-element-interactions`. This replaces react.md's "canvas-scoped keys use `onKeyDown`" rule (amended in T003, Complexity Tracking).
  - Each global combo is checked in Chrome, Firefox and Safari on macOS (T071); a swallowed combo gets another `code`.
- **Alternatives**: Plain single-key globals (previous plan) violate 2.1.4. Ctrl/Cmd combos collide with browser shortcuts. A shortcut library is a new dependency for about 60 lines of code.

## R10. Workspace routing

- **Decision**: No router and no URL hash. The active workspace is a preference (`activeWorkspaceId`), restored on reload (FR-004).
- **Rationale**: The spec requires restore on reload, not deep links. A URL hash adds history and back-button behaviour nobody asked for. This closes the roadmap open decision "URL hash vs in-memory": in-memory plus preferences.

## R11. Unavailable actions and hints

- **Decision**: The unavailable project-bar actions and tools are `<button aria-disabled="true">`, not `disabled`, so they stay focusable. Their click handlers do nothing. A `Tooltip` primitive (a CSS-only reveal on `group-hover` / `group-focus-visible`, `role="tooltip"`, linked with `aria-describedby`) shows "Not available yet". `Button` and `RadioGroup` items take a `hint` prop for it. WCAG 1.4.13 (dismissible): Escape on the focused control sets `data-tooltip-dismissed`, blur or pointerleave clears it, and the tooltip carries `group-data-tooltip-dismissed:hidden`.
- **Rationale**: A native `disabled` button cannot be focused, so keyboard users would never see the hint (US4 scenario 7, US6 scenario 2).

## R12. Problems panel data

- **Decision**: A `WorkspaceIssue` type in `src/ui/shell/workspace-issue.ts`: the observability.md issue shape `{ code, message, path }` plus `workspaceId`. `app.tsx` passes a module constant `NO_ISSUES: readonly WorkspaceIssue[] = []`. Badges come from counting by workspace and are hidden at 0. One always-mounted polite `role="status"` region in `app.tsx` (not inside the panel) renders the total issue count; React updates its text when the total changes, so assistive technology announces it. The project-bar save status is plain text, so this is the only status region.
- **Rationale**: The slot is real and testable now; later features replace the constant with derived validation issues (observability.md issue shape plus workspace).

## R13. Testing scope

- **Decision**: Vitest in the node environment, with no DOM test library. Pure logic has unit tests colocated as `*.test.ts`:
  - `parsePreferences` (valid, partial-corrupt field, wrong version, invalid JSON, not an object), `loadPreferences` / `savePreferences` with throwing storage
  - `parseGridSizeInput`
  - `snapToGrid`
  - `zoomAt` (zoom around a point, clamped)
  - `displayGridStep` (thinning)
  - `panViewportByU`
  - `clampPanelPosition`, `panelPositionForKey`
  - `matchShortcut`, `formatModifier`
  - `getShortcutAction`
  - the `theme-init.js` key check
  
  UI behaviour is verified manually through `quickstart.md`, which includes the keyboard and contrast pass from accessibility.md.
- **Rationale**: AGENTS.md §4: "UI tests only for non-trivial interaction logic". The non-trivial logic is extracted into pure functions, so it is tested without jsdom. Adding jsdom and Testing Library is two dependencies for tests that would mostly check markup.

## R14. Lint config follow-ups

- **Decision**: Update `.oxlintrc.json` in this feature:
  - The step-folder regex `(layout|wiring|keymap|settings|export)` becomes `(schematic|bindings|firmware|export)`.
  - Add the `style` prop override for `floating-panel.tsx` (R7).
  - Block `storage/`, `canvas/`, `shell/` and `preferences-context` imports in `ui/components/`; messages say "workspace folder".
  - `react/only-export-components` allows `usePreferences` and `useProject`.
  - `jsx-a11y/no-noninteractive-tabindex` allows roles `tabpanel` and `application` (canvas `<svg>`), keeping `tags: ["pre"]`.
  - `public/theme-init.js` is linted type-aware; it avoids `no-empty` and `typescript/no-unsafe-*` by construction (R2), so no override unless a rule still fires, then one naming the exact rules.
- **Rationale**: The workspace names changed with this spec, and the lint boundaries must follow them.

## R15. Viewport state: draft over stored

- **Decision**: `preferences.viewByWorkspace[id]` is the single source of truth for each canvas view. `WorkSurface` keeps an optional local `draftViewport` only during a continuous gesture: middle-button drag pan, wheel pan/zoom, or minimap drag. It renders `draftViewport ?? storedViewport`. On gesture end (pointerup, or 200 ms after the last wheel event) it commits the draft with `changePreferences` and clears it. Discrete actions write the stored value directly and clear any draft: zoom and reset buttons, shortcuts (including arrow-key pan), minimap click. The same pattern positions the tool window (R7) and the grid size field text (a `string | undefined` draft).
- **Rationale**: Gestures run at display rate without re-rendering every preferences consumer at 60 Hz, which keeps the performance goal. External writers (shortcuts in `app.tsx`, minimap) never race a stale local copy, because outside a gesture there is no local copy.
- **Alternatives**:
  - Viewport only in preferences, updated on every pointer move: this re-renders the tab bar, dialogs and status bars at 60 Hz, and writes `localStorage` at 60 Hz.
  - Viewport only as local surface state with imperative `ref` commands for shortcuts: that is a second API surface (`useImperativeHandle`) plus a ref chain from `app.tsx` down to the active workspace.
