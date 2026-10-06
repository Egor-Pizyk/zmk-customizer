---
description: App shell layout, design-system primitives, validation display and copy tone for screens.
paths:
  - src/ui/**/*.tsx
---

# Admin UI patterns

What screens look like and which primitives exist. Component and state rules: `react.md`. Classes and tokens: `tailwind.md`. Keyboard/ARIA details: `accessibility.md`.

## App shell

```
┌ nav ─────────┬ header (project bar): name · save status · New/Open/Save · undo/redo ┐
│ Schematic 2  ├ main ────────────────────────────────────────────────────────────────┤
│ Bindings     │ <h1>Schematic</h1>                                                   │
│ Firmware     │ workspace content: work surface + tool window, or forms              │
│ Export       ├ footer (status bar): position · zoom · snap · grid · Problems (2) ───┤
│ ⚙ Settings   ├ problems panel (when open) ──────────────────────────────────────────┤
│ ? Help       │ issue list                                                           │
└──────────────┴──────────────────────────────────────────────────────────────────────┘
```

- Regions and accessible names are the contract in `specs/001-app-shell-ui/contracts/ui-regions.md`; later features fill slots, not new layout.
- Landmarks: `<nav aria-label="Workspaces">` (left tab bar: 4 workspace tabs, Settings and "Keyboard shortcuts" buttons in its footer), `<header>` (project bar), `<main id="main">`. The current workspace tab has `aria-current="page"`. Workspaces are always reachable; issues never lock navigation.
- Workspace tab issue badge shows that workspace's issue count as text (`2`), with an accessible name "Schematic, 2 problems". No badge when 0.
- Status bar `<footer>` ends with `IssuesToggle` "Problems (N)", which opens the problems panel (`<section id="issues-panel">`).
- Save status in the project bar: "Saved in this browser" normally, plain text; on storage failure a persistent warning banner below the header (`code-quality/observability.md` → "Storage failures"). The status never flickers per edit.
- The inspector shows the selected entity's fields. Nothing selected → the aside is not rendered and main takes the width. It is a panel, not a modal: no focus trap, no backdrop.
- Active workspace is a preference restored on reload; no URL hash (spec 001 research R10).

## Density

- Body text `text-sm` (14px, set once in `src/styles.css` base). `text-xs` only for badges, table meta, units. Workspace `<h1>` is `text-lg font-semibold`; section `<h2>` `text-base font-semibold`.
- Controls and table rows `h-8` (32px); `IconButton` `size-8`. Nothing clickable below 24×24px (WCAG 2.5.8).
- Rhythm: `gap-2` inside a control group, `gap-4` between fields, `gap-6` between sections, `p-4` panel padding. Borders over shadows; `rounded-md` for controls, `rounded-lg` for panels and dialogs.

## Primitives (`src/ui/components/`, build on first need)

| Primitive | Built on | Contract |
|---|---|---|
| `Button` | `<button type="button">` | `variant`: primary / secondary / ghost / danger; `size`: sm / md. One primary per view. |
| `IconButton` | `<button>` | Required `label` → `aria-label`; icon is inline SVG, `aria-hidden`, `currentColor`. |
| `Field` | `<div>` + `<label>` | Label, optional one-line description, issue messages; wires `id`, `aria-describedby`, `aria-invalid`. |
| `TextField`, `NumberField`, `Select`, `Checkbox`, `Switch` | native `<input>` / `<select>`, `Switch` = checkbox with `role="switch"` | Use `Field`; `NumberField` has `unit` (`u`, `°`, `ms`) shown as suffix and in the label. Draft/commit per `react.md`. |
| `RadioGroup` | `<fieldset>` + `<legend>` | Small closed choices: diode direction, kscan type, split/unibody. |
| `Table` | `<table>`, `<th scope>` | Sticky `<thead>`; own `overflow-auto` container; selection column (see "Tables"). |
| `Tabs` | `role="tablist"` buttons | Roving tabindex, arrows + Home/End, automatic activation. Used for layer tabs and file preview. |
| `Dialog` | `<dialog>` + `showModal()` | `open`, `onClose`, `title` → `aria-labelledby`. Escape and focus return are native. |
| `Popover` | `popover` attribute | Non-modal pickers (binding picker, overflow menu). No positioning library. |
| `StatusMessage` | `<output>` (polite status region) | Lives in `ui/shell/status-message.tsx` (it reads the project context). Always mounted, empty on load; each announcement is a keyed `<span>` inside it, so a repeated text is announced again. |
| `EmptyState` | `<div>` | One sentence + the primary action ("No keys yet. Add key / Start from preset"). |
| `Badge` | `<span>` | `tone`: neutral / danger / warning / success; always text, never color alone. |
| `CodeBlock` | `<pre><code>` | `font-mono text-xs`, `tabIndex={0}` + `aria-label={path}` (scrollable region), "Copy" button → `navigator.clipboard.writeText`. No syntax-highlighting dependency. |
| `Kbd` | `<kbd>` | Shortcut hints in help and tooltips. |
| `DocsLink` | `<a>` | See next section. |

### Tables

- Plain `<table>`, no ARIA grid. The first column is a selection checkbox ("Select key 12"), the second a row header `<th scope="row">Key 12</th>`; editable cells hold normal fields, reached with Tab.
- The selection column is one tab stop (roving tabindex): ArrowUp/Down move between rows, Space toggles, Shift+ArrowUp/Down extends. Arrows inside number fields keep their native stepping.
- Selected rows use `data-selected` for styling; the checkbox is the accessible state. Selection is shared with the canvas (`react.md` → "Project state").

No icon set (ADR 0009): the few icons needed are inline SVG components in `components/icons/`, added one at a time.

## ZMK option pattern

Every catalog-backed control (behavior, keycode, Kconfig option) shows label, one-line description and a docs link from the entry's `docsUrl` (AGENTS §3.4: v0.3 docs, `https://v0-3-branch.zmk.dev/docs/`). Components never hand-write a docs URL.

```tsx
// ✅
<Field label={option.label} description={option.description} docs={<DocsLink href={option.docsUrl} topic={option.label} />}>
  <Switch checked={isEnabled} onCheckedChange={handleSleepToggle} />
</Field>
// DocsLink: <a href={href} target="_blank" rel="noreferrer" title="ZMK docs: {topic}"><ExternalLinkIcon /><span className="sr-only">Docs for {topic} (opens in a new tab)</span></a>

// ❌ hard-coded URL, main-branch docs, no context for screen readers
<a href="https://zmk.dev/docs/config/power">Docs</a>
```

## Validation display

- The problems panel lists issues: one `<button>` per issue with `issue.message` as text. Activating it selects the entity from `issue.path` and moves focus to it (key on canvas, field in inspector, pin row).
- The Export workspace lists all issues and a download button that is `disabled` with visible text "Fix 3 problems to download" referenced by `aria-describedby`.
- Field-level: `Field` renders issues whose `path` matches under the control, sets `aria-invalid` and adds the message id to `aria-describedby`. Canvas: conflicting keys get `data-conflict`, a warning icon and the issue in their accessible name.
- Issues are shown while editing, not only after an attempt; domain operations are total, so the conflict is visible the moment it exists.

## Destructive actions

- Undo is the default safety net: delete key, delete layer, clear pins run immediately and show "Deleted layer Nav. Undo" in `StatusMessage`. The toast stays until the next commit or dismissal (no timer).
- A confirm `Dialog` only for what undo cannot restore: New project / reset, import replacing the current project, discarding a corrupt storage backup. The confirm button names the action ("Start new project"), not "OK".

## Keyboard shortcuts

- Global: Alt+Shift+key, matched by `KeyboardEvent.code` (Option changes `event.key` on macOS): Alt+Shift+1..4 workspaces, `,` settings, P problems panel, / help. When focus is in a text input, textarea or select, or a modal dialog is open, the native behavior wins; do not intercept.
- Scoped (single keys, only while their widget has focus, WCAG 2.1.4): canvas `s`, `g`, `=`/`+`, `-`, `0`, arrows, `?` (details in `accessibility.md`).
- Project: `Mod+Z` undo, `Mod+Shift+Z` redo, `Mod+S` save, `Mod+O` open, matched by `KeyboardEvent.code` (`specs/002-project-foundation/contracts/shortcuts.md`).
- Full list: `specs/001-app-shell-ui/contracts/shortcuts.md`. One `as const` list (`SHORTCUTS` in `ui/shortcuts.ts`) is read by both the handler and the help dialog, so help cannot drift. The help dialog opens from the tab-bar footer button "Keyboard shortcuts".

## Loading and async

- No network, so no spinners. Synchronous commits and generator previews render immediately.
- The only async work is reading an import file and building the zip. The triggering button shows "Building zip…" and `aria-busy` while pending, and the result or error goes to `StatusMessage`.

## UI copy

- Sentence case everywhere ("Add key", "Diode direction"). Buttons are concrete verbs + object: "Add layer", "Download .zip", "Assign rows automatically". Never "Submit", "OK", "Yes".
- Keys are named by key index as ZMK counts them, 0-based: "Key 12". Units are always shown: `1.25u`, `15°`, `30 ms`.
- UI copy may say "keyboard" and "controller"; other terms follow the glossary (`code-quality/naming/variables.md`).
- Errors say what is wrong and how to fix it, naming the entity (`observability.md` → "Validation issues").
