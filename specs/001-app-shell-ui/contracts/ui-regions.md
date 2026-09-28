# Contract: UI regions and accessible names

Later features rely on these regions being stable: they add content to slots, not new layout.

```
┌────┬──────────────────────────────────────────────┐
│ T  │ Project bar  (header)                         │
│ a  ├──────────────────────────────────────────────┤
│ b  │ h1 workspace name                             │
│    │ ┌ ruler ───────────────────────────────────┐  │
│ b  │ │ [tool window]  work surface (SVG) [snap±] │  │
│ a  │ │                                 [minimap] │  │
│ r  │ └──────────────────────────────────────────┘  │
│    │ Status bar                  [Problems (N)]    │
│ ⚙  ├──────────────────────────────────────────────┤
│ ?  │ Problems panel (when open)                     │
└────┴──────────────────────────────────────────────┘
```

| Region | Element / role | Accessible name | Notes |
|---|---|---|---|
| Skip link | `<a href="#main">` | "Skip to main content" | First focusable element; `sr-only focus:not-sr-only` |
| Tab bar | `<nav>` | "Workspaces" | Left edge, always visible; narrow icon column below 1024 px (labels in tooltips), labels shown from `lg:`. Four buttons, current one has `aria-current="page"`; explicit `aria-label` includes the badge text ("Schematic, 2 problems") |
| Settings button | `<button>` in the tab bar footer | "Settings" | Opens the settings dialog |
| Help button | `<button>` in the tab bar footer | "Keyboard shortcuts" | Opens the help dialog |
| Project bar | `<header>` | — | Name, save status (plain text), New/Open/Save/Undo/Redo (`aria-disabled="true"` + tooltip "Not available yet") |
| Main | `<main id="main">` | — | Contains `<h1>` = workspace name. Focus moves to the `<h1>` (`tabIndex={-1}`) on workspace change; `<title>` is "<Workspace> — ZMK Customizer" |
| Work surface | `<svg role="application" tabIndex={0} data-canvas-workspace="<id>">` | "<Workspace> canvas" | Canvas workspaces only. The `<svg>` itself is the tab stop; canvas-scoped shortcuts (`contracts/shortcuts.md`) apply while it has focus, including arrow-key pan. Schematic (spec 003): name "Schematic canvas, N keys. …"; keys inside are `role="graphics-symbol"` focus stops with roving tabindex; see `specs/003-schematic-switches-wires/contracts/ui.md` |
| Parts list (Schematic, spec 003) | `<section>` below the work surface, `<details>` open state = preference `isPartsListOpen` | `<h2>` "Parts" | Keys, Wires, Crossings tables: the keyboard and screen-reader path for the schematic |
| Rulers | `<svg aria-hidden="true">` | — | Decorative; the position is in the status bar |
| Minimap | `<svg aria-hidden="true">` | — (pointer-only; jsx-a11y rejects `role="img"` on `<svg>`) | Dragging is the pointer path; the keyboard path is arrow-key pan, zoom and reset on the canvas |
| Surface controls | `<button aria-pressed>` + zoom in / zoom out / reset view buttons, top-right | "Snap to grid", "Zoom in", "Zoom out", "Reset view" | Snap is the same setting as the settings dialog |
| Tool window | `<section>` | "Tools" | Title bar is a `<button>` handle ("Move tools window, use arrow keys"); collapse button `aria-expanded`; tools are a `role="radiogroup"` of `role="radio"` buttons, unavailable ones `aria-disabled` with hint. From spec 003: Select, Key, Wire, all available, hints show their shortcut |
| Status bar | `<footer>` rendered by the work surface | — | Position, zoom, snap, grid size; `IssuesToggle` "Problems (N)" (`aria-expanded`, `aria-controls="issues-panel"`) |
| Placeholder footer | `<footer>` in Firmware / Export | — | `IssuesToggle` only |
| Problems panel | `<section id="issues-panel">` | `<h2>` "Problems" | List, or "No problems" |
| Live region | `<output>` (implicit `role="status"`) rendered by `shell/issues-announcer.tsx` in `app.tsx`, always mounted, visually hidden | — | Renders the total issue count; the only status region in the shell |
| Settings dialog | `<dialog>` | `<h2>` "Settings" | Theme radio group, grid size (preset select plus text field, u), switches: grid, snap, rulers, minimap; "Reset to defaults"; notice when storage is unavailable |
| Help dialog | `<dialog>` | `<h2>` "Keyboard shortcuts" | Tables rendered from `SHORTCUTS` plus pointer gestures, with platform modifier names |
| Placeholder workspace | `<main>` content | — | Empty state: heading plus one sentence on what will appear, for example "ZMK settings for your keyboard will appear here." |
