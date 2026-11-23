# Feature Specification: Product workflow clarity

**Branch**: feature/041-product-ux-audit
**Created**: 2026-11-22

## Goal and scope

Surface the action that advances the task in each workspace. Preserve project formats, autosave, history, keyboard editing, advanced tools, offline use and ZMK v0.3.0 export bytes for the same inputs.

## User scenarios and acceptance

- **FR-001 (P1)** Given an invalid project, Export shows the issue count and repair links as its first content. Download remains identified and disabled. A repair link focuses its existing target. Once valid, Download precedes optional build settings and the file preview remains available.
- **FR-002 (P2)** Given an empty layout, Schematic keeps Add key and KLE import available. Selected-key actions, renumbering and precise properties appear after the first key and recede on undo. Given empty Bindings, its link to Schematic precedes optional editors. Given populated Bindings, the layer controls precede those editors.
- **FR-003 (P2)** Given a firmware query, activating Clear search empties the query and returns focus to the search field. The button is inactive when the query is empty. Issue navigation still reveals the owning control through a filter.

## Edge cases and success criteria

Use the same content order for pointer and keyboard. Preserve focus on workspace navigation and issue repair. At 640px the changed controls remain usable and wrap as required. Use existing tokens in light, dark and system themes with no new motion. Keep the download busy and failure states, workflow inclusion default and stale preview protection. Verify state and output before and after each journey.

## Assumptions

The released application on origin/main is the baseline. PRs #29, #34 and #41 own pending project-control and Schematic work on their own branches.
