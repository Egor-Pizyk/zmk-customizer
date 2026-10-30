# Behavioral regression testing

This document owns behavioral test policy and browser verification. Completion commands by change type live in [commands.md](commands.md). Historical measurements are in [testing history](testing-history.md); they are not current-tree verification.

## Contracts and test boundaries

Tests assert what the product must do, independently of its implementation. Inputs
come from requirement examples, historical project fixtures and pinned upstream
ZMK output. Expectations must not be computed by the function being tested.

### Behavior before implementation

First determine the correct observable behavior from an accepted requirement,
domain invariant, independently worked example, historical compatibility fixture or
verified pinned ZMK source. Resolve material uncertainty before choosing an expected
value. Existing implementation output is not its own specification. Then define the
matrix below and write tests; implementation follows those contracts. Write the behavioral contracts before implementation where practical; execute tests
at the task/feature boundaries below, not while APIs/imports are knowingly incomplete.

### Core behavior matrix in the specification

Before writing new tests or changing their expected results, add/update the affected
core behavior rows in the owning `spec.md`. Cover main outcomes, relevant failure/
boundary cases and preserved contracts; do not enumerate every helper or duplicate
an existing row for each permutation. Reuse stable row IDs and link the existing
requirement/task/test/evidence mapping rather than maintaining a second copy.

| ID / requirement | Files (source and test) | Main methods / operations | Condition / input | Expected observable result | Why correct / independent source | Wrong variant / bug the test rejects |
|---|---|---|---|---|---|---|
| BM-001 / FR-… | [owning file; test file] | [public method/operation] | [concrete state, input or boundary] | [specific output, rejection or preserved state] | [requirement/invariant/source plus independently derived example] | [plausible incorrect result and the assertion that distinguishes it] |

The matrix is behavioral traceability, not implementation design. During specification,
file/method locations may be pending; fill them from the plan before writing the test.
Do not invent APIs merely to fill a cell. For existing code use actual owners; planned
paths/symbols are explicitly marked. If no owning spec exists, establish ownership
before product tests; tooling tests may use their owning maintenance specification.
Documentation-only changes that add no tests need no artificial matrix.

### Review the expected result

For every affected core row ask **“Why is this result correct?”**
(“Почему этот результат правильный?”). Point to the source and show enough derivation
to check the exact expected value independently. “The code returns it”, a copied
snapshot or a mirrored implementation formula is not an answer. Use this review
when first writing expectations and whenever changing them to fix a failing test.
Keep the explanation in the matrix; add a test comment only for non-obvious reasoning.

### Evidence that tests reject wrong behavior

A green run becomes convincing when the wrong behaviors it actually rejects are
known. Each core row names a plausible bug and its distinguishing assertion; record
observed rejection evidence for the core behavior in the existing verification
journal, linked by row ID. Use a reproduced pre-fix regression or a small controlled
behavioral mutation/counterexample probe. One probe may support several rows when
its observed failures demonstrate their assertions; no full mutation suite is
required per row or task. Mere enumeration of hypothetical bugs is not evidence. Keep the intended assertions
unchanged while probing a plausible behavior defect; changing expected values merely
to force a failure proves nothing.

A missing export, compile/lint error, timeout or broken runner is preliminary red,
not proof of behavioral sensitivity. Require the intended observable or saved/output
assertion to reject the incorrect behavior. Mutation probes restore exact source
bytes and follow runner safety rules. An agent forbidden to edit production code
hands probes to the implementer or an existing mutation runner. Record unprobed
variants as limits; do not claim they are detected. If a meaningful wrong variant
passes, strengthen the scenario/assertion before claiming that behavior protected.
Run the mandatory changed check only at the completed logical checkpoint below.

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

Use the separate commands in [commands](commands.md). CI retains coverage floors,
tooling and browser matrix. Local static, unit and browser stages are independent;
no static/unit command may implicitly start Playwright.

### Changed-check cadence

1. **Logical module:** finish all related source/test files, imports/exports, types
   and callers, then run `npm run check` (architecture, types, lint, format). Do not
   run during an obviously incomplete edit sequence. Pre-commit/check:changed provide
   the same static-only responsibility on exact staged bytes.
2. **Completed task item:** run `npm run test:unit` (all app and tooling units).
   `test:unit:changed` is available for staged impact checks but does not replace
   the full-unit task checkpoint. Author contracts/matrix first; there is no mandatory
   early red execution or per-file TDD run while implementation is incomplete.
3. **Actual unit failure:** finish the related repair, then use
   `test:unit:focus -- path/to/test -t "case"` for that failed module/case. Do not
   use focus routinely before the full suite has exposed a failure. Record the
   full-run failure and the diagnostic result; full units run again at the next
   task/final checkpoint, not after every diagnostic edit.
4. **Feature/final commit:** after implementation, static checks and unit repairs are
   complete, run the entire configured `test:e2e` suite explicitly. No partial or
   full browser run mid-task. On a final-suite failure repair it, complete static/unit
   checks appropriate to the repair, and rerun the final suite before claiming it passed.

This cadence supersedes generic early-red/combined-check execution instructions in
older feature artifacts; their behavior assertions and acceptance coverage remain.
No repeated successful run is required for the same unchanged scope/revision. Batch
fixes before validation; do not split knowingly incomplete work into checkpoints.
Intermediate module commits run static-only hooks. Full unit/coverage and E2E remain
separate CI jobs; local check does not provide their evidence. Mutation sensitivity
experiments are deliberate boundary-stage work, not automatic per-edit test runs.
Reporting-only edits use documentation checks, not a new product E2E cycle.

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

`make check` typechecks/lints browser test source but executes no unit/browser suites.
Vitest coverage gates remain in the separate CI unit job.
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
- For a discovered bug, define its expected behavior and regression contract before the repair. Execute it with the full unit task checkpoint and final E2E stage; a knowingly incomplete API/import is not a required red checkpoint.
- For a substantial new interaction contract, prove test sensitivity with a controlled behavioral regression. Run it separately from checks and production edits, require a user-facing or saved-data assertion failure, and restore exact original files. Do not require every domain permutation or all six existing browser seeds for every feature.
- The complete configured browser suite runs only at feature/final completion locally; CI retains its browser matrix. Add representative Firefox/WebKit cases for engine-sensitive behavior without running them mid-task.
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

Define behavior and the spec matrix before implementation. Complete the module and
run static checks; execute all units at the task boundary. Only after that run exposes
a failure, repair it and use `test:unit:focus` for the named failing file/case. Inspect
actual assertion failures and retain expected-result rationale. `test:unit:changed`
is a separate optional staged-impact command, not a hidden static/browser stage.
Final full configured E2E runs only at feature completion. Exact static/unit staged
receipts are separate; a passing static stage cannot stand in for tests. See
[commands](commands.md) and the cadence above. No script rewrites assertions.
