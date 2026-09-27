# 0003. Single serializable Project state, pure operations, versioned migrations

Status: Accepted
Date: 2026-09-27

## Context
Every feature (layout, wiring, keymap, settings) edits the same keyboard. The project must be saved to `localStorage`, exported as JSON, undone and redone, and fed to deterministic generators. Old exported files must keep loading as the model grows.

## Decision
- One `Project` value: plain JSON only (no classes, `Date`, `Map`, `Set`), with `schemaVersion: number`.
- Every change is a pure domain function `(project, input) => project` in `src/domain/`. The UI never mutates state.
- Undo/redo is a stack of previous `Project` values.
- Each schema change bumps `schemaVersion` and adds a migration `vN -> vN+1` in `src/storage/`; parsing untrusted input happens only there, with a schema.

## Consequences
- Save, export, undo and generator input are the same value; no mapping layers.
- Domain rules are unit-testable without React.
- Every schema change costs a migration and a test that loads a vN file.
- Whole-object snapshots rely on the project staying small (hundreds of keys, not millions).
