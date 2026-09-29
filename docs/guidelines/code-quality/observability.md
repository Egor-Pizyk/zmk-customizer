---
description: Error surfacing for src — ValidationIssue values vs throw, Result for parsing, logging, single error boundary.
globs:
  - src/**/*.ts
  - src/**/*.tsx
---

# Observability

No backend, no telemetry, no network. Observability here means: every failure is visible to the user in words that say what to fix, and every bug is reproducible from the project JSON alone.

## Validation issues

- Every problem the user can cause is a `ValidationIssue` from a domain `validateX` function (return-vs-throw rule: `typescript.md`).
- One shape for all issues:

```ts
type ValidationIssue = {
  readonly code: ValidationCode;           // string-literal union, e.g. 'key-without-cell' | 'pin-used-twice'
  readonly message: string;                // full sentence shown as-is in the UI
  readonly path: readonly (string | number)[]; // location in Project, e.g. ['keys', 12] or ['layers', 1, 'bindings', 4]
};
```

- `path` points at the offending entity in `Project` (same convention as zod issue paths), so the UI can highlight that key, pin or binding and jump to it. Never an empty path when an entity is at fault.
- `message` names the entity with the numbering the UI shows and says what to do. No internal jargon, no stack traces, no "invalid input".
- Tests assert on `code` and `path`; message wording can change freely.
- Export is blocked while any issue exists; the export view lists all issues, each linking to its entity.

```ts
// ✅
{ code: 'key-without-cell', message: 'Key 12 has no matrix cell. Assign it a row and column in Wiring.', path: ['keys', 12] }
{ code: 'pin-used-twice', message: 'Pin D4 is used by row 2 and col 5 on the left half. Pick a different pin for one of them.', path: ['halves', 'left', 'rowPins', 2] }

// ❌
{ code: 'error', message: 'Invalid matrix', path: [] }
throw new Error('duplicate pin');
```

## Storage failures (`storage/`)

Storage is the only I/O and every failure mode is handled explicitly, mapped to a readable message:

| Failure | Handling |
|---|---|
| `localStorage` unavailable (private mode, blocked) | Keep working in memory; persistent banner: autosave is off, export to keep work. |
| Quota exceeded on save | Same banner; never drop the in-memory project. |
| Stored JSON corrupt / fails schema | Copy the raw string to a backup key before anything can overwrite it; start empty; offer to download the raw backup. |
| Stored or imported `schemaVersion` newer than the app | Refuse with "This file was made by a newer version of ZMK Customizer." Do not touch current state. |
| Import fails parse / schema | Show the zod issue paths as a list; current project unchanged. |

- Parse functions return `Result` (`typescript.md`); callers switch on `ok`, they do not wrap in try/catch.
- `try/catch` exists only around the actual browser call that can throw (`localStorage.setItem`, `JSON.parse`, `file.text()`), and converts the error into a `Result`/message right there.
- Never an empty `catch`, never `catch` that only rethrows, never a catch that hides the failure without telling the user.

```ts
// ✅
export function saveProject(project: Project): Result<void, StorageError> {
  try {
    localStorage.setItem(PROJECT_STORAGE_KEY, serializeProject(project));
    return { ok: true, value: undefined };
  } catch (error) {
    return { ok: false, error: toStorageError(error) }; // 'quota-exceeded' | 'unavailable'
  }
}

// ❌
try { localStorage.setItem(PROJECT_STORAGE_KEY, json); } catch {}
```

## Crashes (programmer errors)

- One error boundary at the root (`ui/error-boundary.tsx`, the only class component).
- The fallback shows the error message and stack in a `<details>` for copying, plus: "Download saved project" (reads the raw string from `localStorage`, not the possibly broken in-memory state) and "Reload".
- A crash never clears, resets or overwrites storage. Autosave only ever writes a project that is a result of a domain operation.
- Async handlers in `ui/` catch at the top and route the failure to the same banner/message system; no unhandled rejections (`control-flow.md`).

## Console

- No `console.*` in `src/`. No dev logger. Debugging happens in tests and the browser debugger; anything the user needs to know goes to the UI.
- Tests and tooling scripts may log.

## Debug aids

- The bug-report artifact is the exported project JSON: it fully reproduces any state. Bug reports and fixture tests start from it.
- Generators are deterministic (AGENTS §3.3), so the diff between generated output and a golden file is the debugging tool. A generator bug gets a fixture that shows the wrong diff first.
- Validation issues are pure data: reproduce by calling `validateProject` on the exported JSON in a test.

## Privacy

- The project JSON contains only what the user typed. Do not add user agent, timestamps, machine info or IDs derived from the environment to it or to exports.
- No `fetch`, `XMLHttpRequest`, `WebSocket`, `sendBeacon`, analytics or error-reporting SDKs. External links (ZMK docs) are plain `<a>` elements.

## Enforced by

- oxlint: `no-console`, `no-empty` (empty `catch`), `no-useless-catch`, `typescript/no-floating-promises` (type-aware, if enabled).
- Review only: issue shape and message quality, path correctness, storage failure table, no network APIs, error boundary behavior, no PII in exports.
