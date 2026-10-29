# Behavioral regression testing

This document owns behavioral test policy and browser verification. Completion commands by change type live in [commands.md](commands.md). Historical measurements are in [testing history](testing-history.md); they are not current-tree verification.

## Contracts and test boundaries

Tests assert what the product must do, independently of its implementation. Inputs
come from requirement examples, historical project fixtures and pinned upstream
ZMK output. Expectations must not be computed by the function being tested.

| Contract | Protection |
|---|---|
| Every edit preserves unrelated keys, layers and wiring | Pure domain tests, frozen-input edit sequences, exact undo/redo and JSON round trips |
| Key identity survives deletion, multi-selection and layer reorder | Multi-key/multi-layer lifecycle tests and rendered app flows |
| Electrical connections survive matrix derivation | 12 matrix dimensions; reconstruct pin pairs from output; unique cells, polarity reversal and wire-order invariance |
| Old or malformed user data cannot corrupt a current project | v1–v5 fixture migration tests, schema rejection, import/storage tests and rendered upload/retry |
| Controller families retain or drop the correct contacts | Four-controller catalog/golden checks, rendered selection, endpoint repair and exact undo |
| Binding editors change the intended layer and keys | Real Action panel search, modifiers, multi-paste, dangling copied targets, tap-dance and mod-morph tests |
| Project edits appear and persist | Real App + providers + StrictMode, labeled controls, screen results and independently loaded saved JSON |
| Canvas gestures are undoable and keyboard alternatives work | Drag preview/commit/cancel, snap/overlap, multi-drag/delete, focus/nudge, selection and pan/zoom |
| Invalid projects cannot export | Rendered validation, disabled action, hidden stale preview, linked problem navigation and recovery |
| Exported bytes match preview and upstream contract | Independent golden fixtures; real ZIP click → unzip → path/content comparison; copy/download bytes and URL cleanup |
| Async failures can be retried safely | Real-hook ZIP lock/failure/retry, clipboard rejection and malformed-file retry |
| App settings do not change project data | Theme/grid validation/reset and physical-key shortcut precedence tests |

Query controls by role and accessible name; use visible button text where jsdom
cannot account for CSS-hidden tooltip text. Avoid class names, internal React
elements, hook call counts and whole-page snapshots. SVG geometry assertions are
limited to externally visible placement/polarity contracts. Golden text assertions
remain intentional: emitted Devicetree/Kconfig bytes are a product output.

Mock OS/browser boundaries only: file reads, downloads, clipboard denial and ZIP
failure injection. React, its hooks, providers, domain functions and generators run
normally. jsdom shims model missing native APIs, not business behavior.

## Commands and regression floors

Use the local snapshot selection, conservative test expansion and exact-tree receipts
in [commands](commands.md). CI owns full unit coverage, static/tooling, browser,
image and mutation suites; firmware compilation is local-only (see Git flow).
Direct/full local commands require a diagnostic or justified-necessity reason in
the task journal. No repeated full-local or three-run browser gate is required.
Tests-first and the final-index hook remain mandatory. Manual acceptance is required only by an explicit task-specific acceptance criterion.

### Changed-check cadence

Run mandatory `npm run check:changed` at a logical checkpoint: the completed scope
of a `tasks.md` item (or `task.md` when that is the task file), or a substantial
completed change such as a cross-module behavior change or large refactor. Finish
its implementation, regression coverage and applicable lint/format fixes together,
then stage the complete checkpoint and check it once before recording it as verified.
A red-only TDD step is intermediate; check the completed red/green unit after its
implementation is ready. Do not split incomplete work merely to create checkpoints.

Within a task, use the affected test, lint or `check:focus` for diagnosis as needed.
Editing or saving a file, adjusting formatting, or responding to an intermediate
failure does not trigger `check:changed`. If later edits invalidate a receipt, finish
the next logical checkpoint and rerun there, rather than after each file edit.
For a failed checkpoint, diagnose and finish the related corrections before rerunning.
Never repeat a successful check of the same tree/base without a concrete reason.

Commit at logical checkpoints. The final-index hook still requires the exact staged
snapshot to pass and reuses its successful receipt; it is not an instruction to
commit/check every file. Reporting-only edits follow the documentation route.
Conservative browser selection and CI gates remain unchanged.

CI publishes one bot coverage comment per PR with the checked SHA, metrics, threshold
outcome and run link. New runs replace it; stale heads/attempts cannot overwrite current
results. Missing/failed coverage is explicit. The publisher runs trusted main code with
minimal write permissions; PR code only runs with read permissions. Full reports are CI artifacts.

Coverage includes executable domain, generators, storage, UI and catalog lookup/
key-header parsing. Static catalog tables, the composition root and type declarations
are not useful coverage targets; their runtime contracts are tested through consumers.
`vite.config.ts` defines both global and layer-specific floors. Do not lower floors
or exclude executable files merely to make checks pass. Missing branches guide new
behavioral scenarios; a percentage alone is not evidence of assertion quality.

`make test-mutations` runs 29 seeded business regressions and requires a failing
behavioral test for each. Run it **alone**: it temporarily changes production files,
restores their exact original bytes including uncommitted work, and refuses to
overwrite a concurrently changed file. It detects changes in controller retention,
key deletion, undo/redo, layer indices in generated keymaps, export validation,
controller/diode UI handlers and explicit shield naming. Update mutation anchors
after a refactor; they are test-quality probes, not product contracts.

## Limits

These Vitest tests verify semantic DOM, displayed text/state, event wiring, SVG geometry,
persistence and output bytes. jsdom has no layout/paint engine: tests do not prove
pixel appearance, responsive clipping, contrast, native modal focus trapping or
screen-reader behavior. They do not compile firmware. Seeded mutations are
not an exhaustive mutation score, and no finite suite guarantees detecting every bug.
Remaining untested branches stay visible in the coverage report.

## References

- [Testing Library guiding principles](https://testing-library.com/docs/guiding-principles/)
- [user-event interaction model](https://testing-library.com/docs/user-event/intro/)
- [Vitest coverage and thresholds](https://vitest.dev/config/coverage)
- [ADR 0012](decisions/0012-behavior-testing.md)

## Real browser behavioral coverage (feature 025)

`make test-e2e` builds a dedicated Node 24 Bookworm browser image and tests the production
build on port 4175. It runs the complete Chromium suite and focused Firefox/WebKit cases.
The existing Alpine development container is retained; Playwright Firefox/WebKit require
glibc. `npm run test:e2e` is the equivalent on a supported host after `npm ci` and
`npx playwright install --with-deps chromium firefox webkit`. The app runner never reuses
an existing server or a normal browser profile. Every test has an isolated context and
imports predictable JSON through the real app's file dialog. Runtime dependencies stay unchanged.

`make check` also typechecks/lints the browser tests; it retains the Vitest coverage gates.
Browser execution is a separate required CI job. It uses one worker and zero retries,
so a flaky first attempt stays visible. CI uploads `playwright-report/` and `test-results/`
for 14 days even on failure. Traces and screenshots are retained for failed tests;
`npx playwright show-trace <trace.zip>` opens a captured trace. Reports and build output
are ignored in git and excluded from Docker build context.

[Git flow](guidelines/git-flow.md#merge-and-release) owns required statuses,
protection and local firmware evidence. CI runs once per PR to main, cancels obsolete
runs, and does not run on push or after merge; releases use a separate workflow.
Keep complete viewport/theme matrices in Chromium; Firefox/WebKit need representative
engine-sensitive cases rather than repeating every presentation combination.

Apply the mandatory browser rules below. Playwright's role union omits
graphics-symbol; canvas keys use the actual Graphics role plus an accessible-name
CSS prefix as a documented compatibility fallback.

Screen polygons are checked corner-by-corner against independent trigonometry, not just
rotated bounding boxes. Screen tolerance is 0.75 CSS px for subpixel layout/serialization;
anchor and edge errors of a meaningful grid step are tens of pixels. Native mouse coordinates
may round to whole pixels, so snap tests choose 0.31u and 43° safely away from 0.375u/37.5°
boundaries; expected snaps remain exactly 0.25u and 45°. Project values use 0.0001u precision.
Switch rotation journeys verify center/corners and painted key visibility, and capture
light/dark screenshots for rendered review. The former resize-preview PNG baselines were
retired when Schematic resize controls were removed (012 FR-021). Browser geometry
assertions remain independent of captured screenshots.

`make test-e2e-mutations` runs alone after `make test-e2e` has prepared the browser image.
It first checks the relevant Chromium baseline, then temporarily seeds disabled rotation,
invisible preview, shifted hit area, lost save, extra Undo, cancelled-value resurrection,
lost actual wiring routes, prematurely saved wiring previews and wrong split column offset.
Each seed must fail its expected behavioral assertion; compiler/runner exceptions do not
count. Exact original production bytes are restored in finally, and concurrent modifications
are never overwritten. Evidence lives in ignored `.e2e-mutations/`. Do not run it alongside
checks, other browser runs or production edits.

See [coverage matrix](../specs/025-playwright-e2e/coverage-matrix.md) and
[verification](../specs/025-playwright-e2e/verification.md) for measured results and limits.
Real-browser automation does not establish screen-reader speech, OS-originated pointercancel,
all desktop sizes/themes, physical keyboard firmware behavior, or absence of all user bugs.

## File organization

Use [folder ownership](folder-structure.md#tests) for test locations and module APIs.
Re-export indexes are excluded from coverage because implementation contracts and
compiler checks cover them.

## Mandatory browser coverage rules

For new or changed user journeys, add or update Playwright E2E tests and include them in the spec, plan and tasks. Keep domain permutations in unit tests; E2E verifies real interaction and agreement across the application. If a feature does not change user behavior and needs no new E2E coverage, record the reason in its artifacts.

- Run the production app in an isolated browser context with a predictable project and real React/providers, storage, domain and generators. Never use or modify an ordinary user browser profile.
- Assert the expected visible result and, where applicable, the saved project and actual downloaded JSON/ZIP. DOM attributes or absence of errors alone are insufficient.
- Use accessible roles/names. For canvas interactions use coordinates of displayed elements; perform drags with `mouse.move/down/up` and intermediate movements.
- Do not mock core services, use `force:true`, dispatch synthetic events, call handlers, change state through `evaluate`, or use arbitrary sleeps. `evaluate` is observation-only; wait for a concrete state.
- Check screen geometry, including corners of rotated elements rather than only bounding boxes. Add independent visual snapshots where they detect paint errors; justify tolerances and inspect the cause of differences before updating references.
- For a discovered bug, first reproduce a failing test, then fix its cause in the owning architectural layer. Domain/generator repairs also require their own tests-first contracts.
- For a substantial new interaction contract, prove test sensitivity with a controlled behavioral regression. Run it separately from checks and production edits, require a user-facing or saved-data assertion failure, and restore exact original files. Do not require every domain permutation or all six existing browser seeds for every feature.
- The complete Chromium suite is mandatory in CI. Add targeted Firefox/WebKit cases for SVG, foreignObject, pointer capture, native inputs and focus where the feature touches them.
- Apply the change-specific completion checks in [commands.md](commands.md). Local selection runs through the changed-check script; full cross-browser execution belongs to CI.
- Retain useful failure traces/screenshots. Record scenario → risk → existing coverage → new E2E → visible assertion → saved/exported assertion, verification results and remaining limits in feature artifacts. Commands and artifact handling are documented in `docs/testing.md`.
- Never weaken assertions to make CI green or claim absence of user problems solely from passing tests.

## Optional UI and accessibility review

There is no blanket before/after rendered UI or manual accessibility review gate.
Choose focused checks for the affected requirement or reported bug; broader visual,
responsive, theme, keyboard or screen-reader audits run only when requested or needed
to resolve a specific acceptance question. Existing automated accessibility tests and
product accessibility contracts remain. Missing optional reviews do not block completion.
Record actual checks and limits without claiming unperformed manual checks passed.

## Performance check scheduling

Performance tests may run alongside independent checks or other work. There is no
repository-wide requirement to stop other workloads or run timed tests alone, including
older feature protocols that prescribed this. Record relevant concurrent load when
interpreting a timing result; isolate a rerun only when diagnosing evidence of contention.
Keep existing metrics, thresholds and assertions. Mutation runners still run alone
because they temporarily edit production files; that restriction protects source data.

## Mutation runner implementation

Both mutation orchestrators are Node ES modules under scripts/. Root Makefile delegates to npm run test:mutations and npm run test:e2e:mutations. These orchestration commands run on host Node 24 and invoke isolated Docker test containers; they do not require host Python. Run them sequentially and alone. Unit mutation subprocesses retain the 120-second timeout. Shared byte mutation/restoration code refuses concurrent edits.

Tooling contracts for restoration, concurrent edits, missing/duplicate anchors, timeout and report acceptance run through npm run check:mutation-runners in make check. Historical migration evidence is linked below.

## Historical evidence

See [testing history](testing-history.md), [browser verification](../specs/025-playwright-e2e/verification.md) and [mutation migration verification](../specs/030-node-mutation-runners/verification.md).

## Focused diagnostic loop

Follow the tests-first requirements in docs/workflow.md: domain, storage, generators and regressions need a failing behavioral contract before implementation. Use the focused loop below during implementation and diagnosis.
Stage explicit paths and inspect `npm run check:focus -- --plan`; run
`npm run check:focus` while fixing failures. Read `summary.json` first and open full
logs only where needed. The bounded UI mapping includes cross-cutting accessibility,
keyboard and onboarding journeys; unknown/shared/global changes retain broad selection.
Update mapping and selection regressions together when introducing new UI areas.
At the logical task/substantial-change checkpoint, stage its complete change and run
mandatory `check:changed` once, following the cadence above. Intermediate edits use
focused diagnostics; reruns wait for the next completed checkpoint or related fix.
Focus and final receipts are separate. This reduces repeated output and diagnostic work without changing final
coverage policy. Test assertions still require human/agent judgment; no script rewrites them.
