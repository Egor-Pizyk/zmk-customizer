---
description: src/ui architecture — workspaces, providers, commit/undo, derived data, effects allowlist, inputs, React 19.
paths:
  - src/ui/**/*.ts
  - src/ui/**/*.tsx
---

# React

How `src/ui/` is written. Base rules (function components, `type XProps`, no logic in components, no effects for derived state, stable list keys) are in `code-quality/typescript.md` → "React"; handler and component names in `code-quality/naming/functions.md`. This file adds the rest. Styling: `tailwind.md`. Screens and primitives: `admin-ui.md`. Keyboard and ARIA: `accessibility.md`.

## Where components live

```
src/ui/
  app.tsx               shell: tab bar, project bar, main, problems panel, status region; mounts use-global-shortcuts.ts
  project-context.tsx   ProjectProvider + useProject
  preferences-context.tsx  PreferencesProvider + usePreferences (theme, grid, active workspace)
  error-boundary.tsx    the only class component (observability.md)
  components/           design-system primitives: button.tsx, text-field.tsx, dialog.tsx, …
  shell/                tab bar, project bar, problems panel, settings and help dialogs
  canvas/               work surface, rulers, tool window (shared by canvas workspaces)
  schematic/ bindings/ firmware/ export/   one folder per workspace, feature screens
```

- Folders and primitives are created when the first feature needs them (AGENTS §3.1). No empty folders, no "just in case" primitive.
- One component per file, file named after it in kebab-case (`key-canvas.tsx` → `KeyCanvas`). A small private subcomponent used only by that file may stay in it, unexported.
- `components/` never imports from a workspace folder and knows nothing about `Project`; it takes strings, numbers and callbacks. A workspace folder may import from `components/`, `canvas/` and its own folder, not from another workspace. Shared feature pieces (e.g. a key shape used by Schematic and Bindings) move to `canvas/` or `ui/` root when the second user appears.

## Project state

- One store: `useReducer` in `ProjectProvider` holding `{ past, present, future }` of `Project` (ADR 0003). Components get `{ project, issues, commit, undo, redo }` from `useProject()`.
- `commit` takes an updater that calls one domain operation. The reducer stays generic; it never learns about keys or pins.
- `getProjectAnalysis(project)` owns contacts, nets, matrix and issues. A WeakMap in project-state.ts shares one result per immutable project across history, provider, schematic and export. UI consumers do not build a separate electrical validation pipeline.

```tsx
// ✅
const { project, commit } = useProject();
function handleWidthCommit(widthU: number) {
  commit((current) => resizeKey(current, { keyIndex, widthU }));
}

// ❌ rule inline, mutation, reducer knows the domain
if (project.keys.some((key) => key.cell?.row === row && key.cell?.col === col)) setError('Cell taken');
project.keys[keyIndex].widthU = widthU;
dispatch({ type: 'resize-key', keyIndex, widthU });
```

- One user gesture = one `commit` = one undo step. A drag keeps a local preview offset in state and commits `moveKey` once on `pointerup`; a text field commits on blur/Enter, not per keystroke (see "Inputs").
- UI state is not project state: hover, open dialog, active tab, selection, drag preview, draft field text live in `useState` of the lowest component that needs them. They are not saved, exported or undone.
- Selection shared by canvas, table and inspector lives in the workspace screen (`SchematicWorkspace`) and is passed down as `selectedKeyIndices` + `onSelectionChange`.
- Props go at most 2 levels deep. Deeper → pass `children`/elements from the workspace screen instead, or restructure. The allowed contexts are exactly `ProjectProvider` and `PreferencesProvider`; no other context without review.

## Derived data

- Compute during render: `const keyByCell = getKeyByCell(project)`. No `useState` + `useEffect` copy of anything derivable from `project`, `issues` or props.
- `useMemo` / `useCallback` / `memo` only after the React profiler shows a problem, with a one-line comment naming it. Exceptions: the provider's analysis above, provider-lived import session tokens, and a context provider's `value` (plus the stable callback it closes over), which `react/jsx-no-constructed-context-values` requires.

## Effects

Effects sync with systems outside React. A change that adds, moves or removes an effect updates this table in the same commit; `npm run check:guidelines` compares parsed production effect calls with the files below (tests and useEffectEvent are excluded).

| Effect | Where |
|---|---|
| `document.documentElement.dataset.theme` sync with the theme preference | `preferences-context.tsx` |
| Focus the workspace `<h1>` when the workspace changes (accessibility.md "Structure") | `workspace-view.tsx` |
| `ResizeObserver`: panel and container sizes into state from the observer callback (clamp derived in render) | `components/floating-panel.tsx` |
| Pointer subscriber registration and cleanup for the surface cursor preview | `canvas/work-surface.tsx` |
| `ResizeObserver`: surface size into state for rulers | `canvas/use-element-size.ts` |
| Non-passive `wheel` listener: Ctrl/Cmd zoom with `preventDefault`, wheel pan; 200 ms commit timer cleared in cleanup | `canvas/use-surface-viewport.ts` |
| `showModal()` / `close()` to match `Dialog`'s `open` prop; `close` event → `onClose`; backdrop `click` listener added with `addEventListener` in the same effect and removed in its cleanup (no JSX `onClick` on `<dialog>`, which fails jsx-a11y) | `components/dialog.tsx` |
| Global `keydown` on `globalThis` for all shortcuts: Alt+Shift globals and canvas-scoped single keys (`shortcuts.ts`) | `use-global-shortcuts.ts` (mounted by `app.tsx`) |
| Schematic `keydown` on `globalThis` for the Schematic canvas ids (tools, Enter, Delete, Escape) that need workspace state; the app listener has no action for them | `schematic/use-schematic-shortcuts.ts` |
| Bindings `keydown` on `globalThis`: Mod+C / Mod+V copy and paste a binding on the Bindings canvas or Keys table | `bindings/use-bindings-shortcuts.ts` |
| `keydown` on `globalThis`: Escape inside `[data-action-panel]` returns focus to the canvas | `bindings/action-panel.tsx` |

- Autosave is not an effect: `saveProject` runs in the project provider's dispatch, the handler that changes the project (spec 002 research R6), so loading never writes and no effect stores the save result.
- Page title is `<title>` rendered by the workspace screen (React 19 hoists it), not an effect on `document.title`.
- Canvas-scoped single keys are matched by the global `keydown` listener in `use-global-shortcuts.ts` when `event.target` is inside `[data-canvas-workspace]` (`onKeyDown` on `role="application"` fails jsx-a11y `no-noninteractive-element-interactions`). Keys of interactive elements (a `<button>` drag handle, a table selection column) use `onKeyDown` on that element.
- Every listener added in an effect is removed in its cleanup. Dependency arrays are complete (`code-quality/typescript.md`).

## Inputs and forms

- All inputs are controlled. Text and number fields keep a draft string in local state while focused and commit a parsed value on blur or Enter; Escape restores the project value. Selects, checkboxes, radios and switches commit on change.
- Native attributes mirror catalog constraints (`min`, `max`, `step`, `required`, `maxLength`) for instant feedback. The domain `ValidationIssue` is the source of truth; never block a commit on `checkValidity()` (domain operations are total, `code-quality/typescript.md`).
- Issues for a field are found by `path` and rendered under it (`admin-ui.md` → "Validation display").
- Dialog forms (new layer, add combo) use `<form onSubmit>` with `event.preventDefault()`; no page reloads, no uncontrolled `FormData` reads.

```tsx
// ✅
<NumberField label="Width" unit="u" min={0.25} step={0.25} value={key.widthU} issues={widthIssues} onCommit={handleWidthCommit} />

// ❌ commits every keystroke (floods undo), string math in the component
<input type="number" value={key.widthU} onChange={(event) => commit((p) => resizeKey(p, { keyIndex, widthU: +event.target.value }))} />
```

## Lists and keys

- `key={key.keyIndex}` for keys, `key={`${cell.row}:${cell.col}`}` for matrix cells, `key={layer.id}` / `key={combo.id}` for user entities. If a reorderable entity has no stable id, that is a domain gap: add the id to the type, do not key by array position.

## React 19

- `ref` is a regular prop; no `forwardRef`. Primitives wrapping a native element accept `ref` and spread it onto that element.
- Read context with `use(ProjectContext)` inside `useProject`; render `<ProjectContext value={…}>`, not `.Provider`.
- Actions (`useActionState`, `useOptimistic`, `useFormStatus`, `<form action>`) are for async submissions; this app has none (ADR 0001). Do not use them for synchronous commits.
- `useTransition` / `useDeferredValue` only for a measured slow render (e.g. keycode search over the full catalog).

## Canvas performance

- Hover and focus looks are CSS (`hover:`, `focus-visible:`, `group-hover:`), never `useState`. Hovering a key must not re-render anything.
- `KeyCanvas` renders one `KeyShape` per key. Handlers are passed once from the canvas and take the key index (`onKeyPointerDown(keyIndex, event)`), so a per-key closure is not needed; add `memo(KeyShape)` only if drag is measured to stutter.
- During a drag only the preview offset changes; derive preview positions for selected keys in render, commit once at the end.

## Errors

- The root `ErrorBoundary` is the only one (`code-quality/observability.md` → "Crashes"). Do not wrap workspaces in their own boundaries or catch render errors to show partial UI.
- Async handlers (import file, build zip) catch at the top and show the message; see `observability.md` for the storage table.
