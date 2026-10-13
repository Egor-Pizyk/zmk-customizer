# Quickstart Validation

Run all tooling inside Docker. Use only isolated automated browser contexts, never a normal profile.

1. Open the existing unibody preset. Wiring grid and Parts agree on actual cells/pins. Export without edits matches existing golden bytes.
2. Select a key and draft another matrix cell; inspect connection preview, Cancel and verify unchanged project/Redo. Repeat Apply; Undo and Redo each restore the whole circuitry in one step. Reload and JSON Save/Open retain exact accepted assignments.
3. Change a row pin without changing row numbering. Create duplicate cells/pins and missing assignments; verify named affected keys/pins and disabled export. Repair and unzip the download; compare preview bytes and GPIO/RC pairs.
4. Auto-assign rotated/staggered keys; inspect routed nets and confirm geometry, bindings and key order unchanged. Change diode direction and verify preview polarity plus downloaded GPIO flags.
5. Convert a small keyboard to direct, assign inputs, verify explicit GND and RC(0,i) for every key. Cancel conversion and Undo preserve prior matrix state.
6. Enable BLE split, inspect initial half boundary, reassign a key, use same GPIO once on each half and verify it is legal. Duplicate within one half and verify issue. Download both overlays and check right offset/two build targets/left-only identity.

Commands during implementation:

- `docker compose run --rm app npm run test -- src/domain/route-wiring.test.ts` (tests first: observe assertion failure before implementation).
- `make check` (all static checks, Vitest and coverage floors).
- `make test-e2e` (production build, complete Chromium and targeted Firefox/WebKit).
- Run new wiring tests three sequential times, no retries, using the browser Docker service/commands documented in docs/testing.md; record exact command and results.
- `make test-e2e-mutations` alone after baseline browser checks; restore exact files and require intended behavior/data assertion failures.
- `make zmk-build` (actual exports including both matrix directions, direct, split left and right).

Populate verification.md with scenario/command/outcome, tests-first evidence, build artifacts and remaining limits. Retain useful failure traces and screenshots under ignored report directories; commit only small intentional evidence. Passing checks do not claim physical hardware or screen-reader speech verification.
