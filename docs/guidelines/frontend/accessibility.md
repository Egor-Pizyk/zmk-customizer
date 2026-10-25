---
description: WCAG 2.2 AA baseline — landmarks, keyboard, ARIA, focus, feature checklist.
paths:
  - src/ui/**/*.tsx
---

# Accessibility

Baseline: WCAG 2.2 AA (docs/principles.md, ADR 0008). A feature is not done until its checklist at the bottom passes. Primitives and copy: `admin-ui.md`. Focus-ring and state classes: `tailwind.md`.

## Structure

- Landmarks as in `admin-ui.md` → "App shell". First focusable element is a "Skip to main content" link (`sr-only focus:not-sr-only`).
- One `<h1>` = the current workspace name. `<h2>` per section (Canvas, Keys, Problems), `<h3>` inside. Dialog titles are `<h2>`. Never skip levels; never pick a heading for its size.
- On workspace change, focus moves to the workspace's `<h1>` (`tabIndex={-1}`) and `<title>` becomes "Schematic — ZMK Customizer". This is how the current workspace is announced (roadmap 001).

## Keyboard

- Everything a pointer can do, the keyboard can do (2.1.1). Every drag has a non-drag alternative: nudge keys and inspector number fields (2.5.7).
- Tab order follows visual order; no positive `tabIndex`. Composite widgets (canvas, tabs, table selection column) are one tab stop each with roving tabindex inside.
- Single keys work only while their widget has focus (2.1.4; canvas: `s`, `g`, `=`/`+`, `-`, arrows, `?`); global shortcuts use Alt+Shift+key matched by `KeyboardEvent.code` (Alt+Shift+1..4, `,`, P, /); project shortcuts use the primary modifier matched by `code`: Mod+Z undo, Mod+Shift+Z redo, Mod+S save, Mod+O open (`specs/002-project-foundation/contracts/shortcuts.md`). Full list: `specs/001-app-shell-ui/contracts/shortcuts.md`; precedence: `admin-ui.md` → "Keyboard shortcuts".
- Modal dialogs use native `<dialog>` + `showModal()`: focus is trapped, Escape closes, focus returns to the opener. Popovers close on Escape and return focus. The inspector is not modal and does not trap focus.
- Focus is never lost: after deleting the focused key, focus moves to the next key by index (or the canvas if none remain); after closing the problems panel, focus stays on its "Problems (N)" toggle.

### Canvas (Schematic, Bindings)

| Key | Action |
|---|---|
| Tab | Enter/leave the canvas; lands on the active key (last selected, else key 0) |
| Arrows | Move focus and selection to the nearest key in that direction |
| Home / End | First / last key by key index |
| Ctrl/Cmd + Space | Toggle the focused key in the selection |
| Shift + arrows | Nudge selected keys by the grid step (Schematic only) |
| Delete / Backspace | Delete selected keys (Schematic only; undo toast) |
| Escape | Clear selection |
| `?` | Open shortcut help |

- The key table is the complete alternative (ADR 0008): every property and operation on the canvas is also reachable there. Screen-reader users are pointed to it by the canvas description.

## Names, roles, states

- Every input has a visible `<label>` (via `Field`); placeholder is never the label. Descriptions and issues are linked with `aria-describedby`; invalid fields set `aria-invalid`.
- Grouped choices use `<fieldset>` + `<legend>` (diode direction, kscan type).
- `IconButton` requires `label`; decorative SVG icons are `aria-hidden="true"`.
- External links (docs) say where they go and that they open a new tab (`admin-ui.md` → "ZMK option pattern").

### SVG

```tsx
// ✅
<svg role="listbox" aria-multiselectable="true" aria-labelledby="canvas-title" aria-describedby="canvas-help">
  <title id="canvas-title">Schematic, 42 keys</title>
  <desc id="canvas-help">Arrow keys move between keys. The Keys table below lists every property.</desc>
  <g role="option" tabIndex={isActive ? 0 : -1} aria-selected={isSelected}
     aria-label="Key 12, 1.5u, at 3, 0.5, rotated 15°, conflict: shares row 2 col 5 with key 13">…</g>
</svg>

// ❌ no role, no name, focus only by mouse, conflict only as red stroke
<g onClick={handleKeyClick}><rect className="stroke-danger" /></g>
```

- Key names start with "Key N" and add what the view is about: Schematic → size, position, rotation, cell and half; Bindings → binding label for the current layer ("Key 12, Base layer: A"). Build the string with a `formatX` function, not inline JSX.
- Key labels rendered inside the SVG are `aria-hidden`; the `aria-label` carries the text once.

## Live announcements

- One polite `role="status"` region in the shell (`app/components/app.tsx`, `StatusMessage`), always mounted. It announces status changes: the issue total when it changes ("3 problems"), undo toasts ("Deleted key 12. Undo"), "Undone" / "Redone", copy/download results.
- The project-bar save status is plain text, not a second status region.
- Storage failures use `role="alert"` once, then remain as a banner.
- Never announce per keystroke or on every autosave.

## Color, contrast, motion

- Color is never the only signal (1.4.1): conflicts = danger stroke + warning icon + text in the name and issue list; selection = accent stroke + thicker stroke; current workspace = `aria-current` + bold/marker; badges carry numbers.
- Contrast comes from token pairs, checked in both themes whenever `src/styles.css` changes: text 4.5:1 (`text`/`text-muted` on every surface, `accent-contrast` on `accent`, `danger` on surfaces); non-text 3:1 (1.4.11) for `focus` against surfaces, `border-strong` where it is the only boundary of an input (plain `border` is decorative, below 3:1), key strokes on the canvas background.
- Focus ring is at least 2px with offset and is never covered by the sticky header or table header (2.4.11): scroll containers set `scroll-pt-*` to the header height.
- Motion: only `motion-safe:` transitions, no animation carries meaning, no auto-scrolling animation (`prefers-reduced-motion`).

The onboarding Step instructions section is a named, keyboard-focusable scroll region so long instructions can scroll independently while Back/Skip/Exit remain visible. Its scoped tabindex lint exception applies only to that section; it does not change widget roles or general tab-order rules.

## Reflow and zoom

- At 200% zoom and at widths under 1024px the tab bar stays as a narrow icon column (labels in tooltips); `lg:` widens it and shows labels; `<main>` scrolls (`min-w-0 overflow-auto`) (`tailwind.md` → "Layout"). Forms, dialogs and issue lists reflow with no horizontal page scroll (1.4.10). Canvas, matrix grid and wide tables are two-dimensional content and scroll inside their own container.
- Text spacing overrides (1.4.12) must not clip labels: no fixed heights on text containers except `h-8` single-line controls.

## Testing

- Lint (jsx-a11y rules) runs in `make check`; its findings are errors.
- UI tests, where they exist, query by role and accessible name (`getByRole('option', { name: /^Key 12,/ })`), which doubles as a name check.
- Manual pass per feature before it is marked done, recorded in the feature's `tasks.md`:

1. Unplug the mouse: complete the feature's acceptance flows with keyboard only.
2. Tab through the workspace: order matches layout, every stop has a visible focus ring, no focus lands on hidden or covered elements.
3. Each composite widget (canvas, tabs, table selection) is one tab stop; its arrow keys work as documented above.
4. Every drag or pointer gesture has a keyboard or field equivalent that was used in step 1.
5. Open and close each dialog/popover with keyboard: focus goes in, Escape closes, focus returns to the opener.
6. Single-key shortcuts do nothing while typing in a text field; Mod+Z inside a field undoes text, not the project.
7. Trigger each validation issue the feature adds: it appears in the problems panel and the workspace tab's issue badge, on the field/key with text or icon (not only color), and the list button focuses the entity.
8. Screen reader smoke test (VoiceOver + Safari or NVDA + Firefox): workspace heading is announced on navigation, key names read correctly, status messages are spoken once.
9. Switch the OS to dark mode and check contrast of any new token pair; toggle reduced motion.
10. Zoom to 200% at 1280px: nothing is clipped, the page does not scroll horizontally.
