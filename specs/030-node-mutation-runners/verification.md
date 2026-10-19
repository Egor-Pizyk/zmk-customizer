# Verification — 2026-10-14

## Sequential parity

Executed the new Node unit runner (29 seeds), then the Node browser runner (six passing Chromium baseline tests + nine seeds), then the original Python unit runner and original Python browser runner in the same order. No concurrent checks, browser runs or production edits occurred.

Node exported main functions were invoked by an external launcher to retain unit results before temporary cleanup. Python originals were executed unchanged through runpy; a subprocess observer copied temporary unit reports after each real Docker invocation and returned the original result. No tests, providers, domain functions or subprocess results were mocked. SHA-256 hashes confirmed the original Python scripts were unchanged throughout comparison.

- Seed inputs, file targets, replacements, selected tests and matcher requirements: identical.
- All 29 unit seed labels, child exit codes and failed assertion names/counts: identical. Failures are sorted for comparison because Vitest worker completion order varies.
- All nine browser summaries, failed test titles/files/projects and error counts: identical. Both browser baselines passed six tests and all mutations failed their intended visible/saved/exported assertions. No runner errors counted as regression evidence. Timing, generated process/container identifiers and artifact path prefixes are excluded from equivalence.
- SHA-256 manifests of every source file (excluding node_modules) matched before/after all four runs. Both runners also enforce restoration between mutations.
- Python scripts were deleted and Makefile switched only after the parity comparison passed.

Evidence: [normalized parity](evidence/parity.json), [Node run](evidence/node-run.log), [original Python run](evidence/python-run.log). Complete browser reports/screenshots are retained in ignored .e2e-mutations/ and the comparison copies under /tmp/zmk-mutation-parity/.

## Safety contracts

Six Node tooling tests cover byte-first replacement (including invalid UTF-8 and CRLF), restoration on success and exception, refusal to overwrite concurrent edits, missing/duplicate anchor rejection, unit/browser report acceptance, and subprocess nonzero exit/timeout handling. These run in make check. Abrupt process termination and host crashes were not part of the parity audit. No runtime dependencies, user journeys, generator logic or exported geometry changed.

## Final verification

- make check: passed; 174 Vitest files / 1016 tests, unchanged coverage floors, 75 architecture/public API tooling tests, six guideline tests and six mutation runner safety tests. Typechecks, lint and formatting passed.
- Production build through infra/compose.yaml: passed. The existing large-bundle warning remains outside this tooling task.
- make test-e2e: passed; 84 tests without retries (44 Chromium, 20 Firefox, 20 WebKit).
- Makefile dry-run resolves both mutation targets to their new npm/Node commands. CI mutation job explicitly provisions host Node from .nvmrc.
- Final formatting check and git diff --check: passed. No Python files remain under scripts/ or active references to the deleted runners in Makefile, package.json, CI or docs.

 No new E2E journey or three-run validation of changed E2E tests is required; existing browser seeds and journeys are unchanged.

## Release maintenance — 2026-10-19

Previous main CI run 39221880634 failed before mutation execution because the layer-reference renderer was refactored and its seed anchor was stale. Updated only the seed anchor/replacement to shift the current `project.layers.findIndex(...)` expression by one; product code and generated output remain unchanged. Added a current-source anchor preflight regression for all registered unit seeds.

- Regression first failed for the stale layer-target anchor: `/tmp/031-release-anchor-red.log`. After repair, all seven runner tooling contracts pass: `/tmp/031-release-anchor-green.log`.
- `make test-mutations` ran alone: **29/29 seeded regressions detected**, including three failing golden assertions for the shifted-layer seed; exact original files restored. Exit 0, `/tmp/031-release-mutations.log`.
- Final `make check`: exit 0; **205 Vitest files / 1203 tests**, static/tooling/coverage gates passed, `/tmp/031-release-check.log`. No product/browser pipeline change; the current product already passed the full 146-test E2E and 32 ZMK target builds recorded in feature 031.
