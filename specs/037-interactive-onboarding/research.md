# Research: Interactive onboarding

**Date**: 2026-10-25. Evidence is repository inspection, not executed product verification.

## Session isolation

**Decision**: Extend the single project provider with explicit normal/tutorial save destinations; park the complete original ProjectState in memory and leave its persisted Project in the existing key.

**Rationale**: `applyHistoryAction` in `src/ui/project/logic/project-state.ts` invokes autosave for commit/undo/redo/replace; autosave currently hardcodes saveProject. `replace` clears history. A tutorial that merely changes the rendered project would overwrite the normal save, and a second provider would still use the same writer. `use-project-state.ts` holds the latest state and pending import-session token, so switching must happen there atomically and invalidate imports. Reload can naturally use the normal existing loader without resuming a tour.

**Alternatives considered**: nested provider (unsafe writer and duplicate provider concerns); stash/replace original as normal history (mixes histories and overwrites save); new Project fields (pollutes file schema); automatic tour resume (contradicts spec).

## Completion ownership

**Decision**: Pure domain onboarding queries consume Project and the existing analysis facts; dispatch evaluates accepted changes. Typed UI acknowledgement signals cover inspection and download.

**Rationale**: `getProjectAnalysis` is the sole UI electrical-analysis boundary and caches immutable projects. Preview projects are separate from committed state. Text announcements are mutable presentation strings and cannot prove download success. `useExportActions` already has the exact browser result needed for a typed success callback.

**Alternatives considered**: clicks/DOM counts as completion (can report success after rejection); re-run electrical analysis in tutorial UI (breaks ownership); use effects to synchronize derived progress (violates React state conventions).

## Target geometry and accessibility

**Decision**: Non-modal teaching panel plus SVG spotlight, native modal Dialog only for safe-start/exit/adoption choices. Typed target anchors and a shared module connect app and workspaces without new React context.

**Rationale**: native modal dialog would make outside real controls inert. Existing components already expose stable data attributes and native fields. The stylesheet bans arbitrary styling and style props; SVG geometry supports measured bounds directly. Observers/listeners are external synchronization and need effect-inventory updates. Apply inert to unrelated siblings rather than the target's ancestors.

**Alternatives considered**: tour package (new dependency/ADR without demonstrated need); cloning controls into the tooltip (not real editing, focus/data duplication); full-screen click catcher without focus restrictions (keyboard escapes into dimmed commands); spotlight with a modal target outside its dialog (target inaccessible).

## Exercise and output

**Decision**: One ordinary 3×3 unibody matrix, recommend nice!nano v2, digit bindings 1–9. Use the existing Add key/position fields and normal wiring Apply flow. No generator/catalog changes.

**Rationale**: verified `docs/zmk/boards.md` and the current controller catalog expose enough connector GPIOs for six matrix lines. Existing `useExportActions` constructs ZIP from preview files. Existing board/firmware descriptions provide pinned docs links.

**Alternatives considered**: preset insertion (skips required learning); hardcoded MCU map (duplicates catalog facts); forcing firmware override (unnecessary hardware choice); requiring advanced features (out of scope).

## Scope reconciliation

**Decision**: 037 follows delivered 036; 038 is cancelled. Preserve unrelated staged 035/roadmap edits in the original checkout. The new worktree starts from origin/main `ad8725dd83ed50a6d7d91fca4e65862f20fc9471`.

**Rationale**: explicit current user request controls scope. Main still has older roadmap ordering and the original checkout contains its pending correction. This planning change records the conflict without absorbing another branch's changes.

No unresolved research questions remain. Before implementation read the pinned ZMK notes relevant to any edited explanation; no external latest-version lookup is needed or appropriate for this pinned target.
