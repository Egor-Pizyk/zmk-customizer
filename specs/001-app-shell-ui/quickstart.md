# Quickstart: validate Application Shell and Workspaces

## Prerequisites

- Docker running. `make install` after pulling (node_modules is a Docker volume).
- Fresh browser profile, or run `localStorage.removeItem('zmk-customizer:preferences')` in the console, before each "first visit" check.

## Automated

```
make check
```

This must pass. The unit tests cover the pure logic listed in research R13:
- preferences parsing and fallbacks, and the storage key shared with `theme-init.js`;
- grid size parsing, snapping, grid thinning;
- zoom around a point, panel clamping;
- shortcut matching, modifier labels and shortcut actions.

## Manual scenarios (`make up` → http://localhost:5173)

Run each with the mouse, then again keyboard-only (Tab / Shift+Tab / Enter / Space / arrows / Escape).

| # | Steps | Expected | Covers |
|---|---|---|---|
| 1 | First visit | Schematic active; tab bar on the left has 4 tabs in order and marks the current one; project bar shows "Untitled keyboard" and "Nothing to save" | US1-1, FR-002, FR-034 |
| 2 | Visit Bindings, Firmware, Export, then press Alt+Shift+1–4 (Option+Shift on macOS) | Heading changes each time and focus lands on it; Firmware/Export show empty states with no grid and no tool window; Bindings has a grid but no tool window | US1-2/6, FR-023 |
| 3 | Reload on Firmware | Firmware is still active | US1-3 |
| 4 | Schematic, grid 0.25u, snap on: move the pointer across the surface | Status bar position shows only multiples of 0.25; pointer marks on the rulers follow | US2-2, SC-006, US9 |
| 5 | Focus the canvas, press `s` (or use the surface snap toggle), move the pointer | Values not rounded; toggle shows off; settings dialog shows snap off | US2-3/6, FR-013a |
| 6 | Settings → grid size preset 1u, then custom 0.1, then `3`, then `abc` | Grid spacing changes in Schematic and Bindings; `3` and `abc` show the allowed range and keep 0.1 | US2-4, US3-5, FR-012, FR-016 |
| 7 | Settings → grid off | No grid lines; snapping unchanged | US2-5 |
| 8 | Settings → Dark, Light, System; toggle the OS theme while System is set | Whole app restyles instantly; System follows the OS | US3-2/3, FR-020 |
| 9 | Set Dark, hard reload (throttle CPU 6× in DevTools) | No light flash before the app appears | FR-022 |
| 10 | Change several settings, reload | All restored | SC-004 |
| 11 | Settings → Reset to defaults | All settings back to defaults | FR-018 |
| 12 | Open settings (button, then Alt+Shift+,); press Escape; open again and click the backdrop; type `0.3` in grid size and press Escape | Closes both ways; focus back on the settings button; while open, Alt+Shift+1–4 do nothing; Escape with a dirty grid size draft reverts the text and keeps the dialog open, a second Escape closes it | FR-017, FR-039, FR-016 |
| 13 | Drag the tool window to the bottom-right, collapse it, reload | Same place, collapsed | US4-3/5 |
| 14 | Focus the tool window title bar, press arrow keys and Shift+arrows | Moves 16 / 64 px and stops at the surface edge | US4-6 |
| 15 | Move the tool window to the far right, shrink the browser to 1024 px | Tool window is pulled back inside | US4-4 |
| 16 | Activate "Add key" and "Wire" | Nothing changes; hint "Not available yet" is shown on hover and on focus | US4-7, R11 |
| 17 | Ctrl/Cmd+wheel over a point; focus the canvas and press `+`, `-`, `0`; pan with wheel and middle-button drag; with focus on the tab bar press `s`, `+` | Zoom keeps the point under the pointer; zoom stays within 25–400%; `0` resets; each canvas workspace keeps its own view; single keys outside the canvas do nothing | US5, FR-013, FR-038 |
| 18 | Zoom to 25% with grid 0.05u | Grid lines are thinned so they stay readable; snapped readout is still in 0.05 steps | edge case, R5 |
| 19 | Drag the minimap rectangle | View follows | US9-2 |
| 20 | Settings → rulers off, minimap off, reload | Both hidden and still hidden after reload | US9-3 |
| 21 | Press Alt+Shift+P; switch workspace; press Alt+Shift+P again, then use the "Problems (0)" toggle | Panel opens with "No problems", stays open across the switch, then closes; no tab shows a badge | US7 |
| 22 | Press Alt+Shift+/; close; focus the canvas and press `?`; then focus the grid size field and type `?`; repeat Alt+Shift+1–4, `,`, P, / in Chrome, Firefox and Safari on macOS | Help lists exactly the shortcuts of `contracts/shortcuts.md` with "Option+Shift+…" on macOS and "Alt+Shift+…" elsewhere; `?` on the canvas opens it; typing `?` in the field only types; no combo is swallowed by any browser | US8, FR-040, SC-008 |
| 23 | Focus New / Open / Save / Undo / Redo; press Escape on one | Each shows "Not available yet"; Escape hides the hint until focus leaves; activating does nothing | US6-2, R11 |
| 24 | Tab to the Schematic canvas; press arrows, then Shift+arrows; switch to Bindings and repeat | View pans 1 grid step, then 1u, per press; each canvas pans only itself; the view is kept after reload | US5-5, WCAG 2.1.1 |

## Robustness

| # | Steps | Expected |
|---|---|---|
| 25 | `localStorage.setItem('zmk-customizer:preferences', '{broken')`, reload | App opens with defaults, no error screen; the stored value is unchanged until a setting is changed |
| 26 | Store `{"version":1,"theme":"dark","gridSizeU":"huge"}`, reload | Dark theme applied; grid size back to default 0.25 |
| 27 | Store `{"version":99}`, reload | Defaults |
| 28 | Block site data (browser setting), reload | App works; settings dialog says settings will not be remembered |
| 29 | OS "reduce motion" on | No transitions on theme change, dialogs or panels |

## Accessibility pass

- The keyboard-only walkthrough of rows 1–24 passes, and focus is always visible.
- Run a screen reader over the tab bar, workspace switching (name announced), the settings dialog and the problems total (polite announcement).
- Contrast: compute each token pair in `src/styles.css` for both themes. Text needs ≥ 4.5:1, focus and `border-strong` need ≥ 3:1 (FR-021, SC-005).
- At 1024 px width with the problems panel open, nothing overlaps the status bar.

## Production CSP check

```
make image && make prod    # http://localhost:8080
```

- Scenarios 1, 8, 9 and 13 work, and the console shows no CSP violations. This confirms `theme-init.js` passes `script-src 'self'` and that React `style` for the tool window position is allowed (research R2, R7).
- Stop it with `make down`.

## Validation log

### 2026-09-27 — implementing agent (no browser available)

| Check | Result | Notes |
|---|---|---|
| `make check` (Docker) | pass | 0 lint errors, format clean, 90 unit tests (after T079 review fixes) |
| `npm run build` | pass | JS 328 kB (100 kB gzip) |
| Production image: `/` headers | pass | CSP unchanged (`script-src 'self'`, `style-src 'self'`, `connect-src 'none'`) |
| `theme-init.js` served and loaded before the module entry | pass | `<script src="/theme-init.js">` precedes the module script; `application/javascript` |
| Built CSS theme mechanism | pass | `light-dark()` lowered by LightningCSS to `--lightningcss-light/dark`; `:root[data-theme=light\|dark]` override both, System follows `prefers-color-scheme` |
| Contrast (SC-005) | pass | all token pairs computed in both themes; values recorded in `src/styles.css` |
| Manual rows 1–29, accessibility pass, SC-003 timing | **pending** | need an interactive browser session (T078) |
| Alt+Shift combos in Chrome / Firefox / Safari on macOS | **pending** | T071 |
