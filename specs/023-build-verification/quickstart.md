# Validation

`make install`, then `make zmk-build`. Docker downloads the digest-pinned official environment; west initializes an isolated cached workspace. Eight generated configs compile sequentially, then a malformed connector copy must fail with its missing-label diagnostic. Artifacts and environment/frozen manifest are in .zmk-build/artifacts; logs in .zmk-build/logs. `make check` validates the existing application. No browser or in-product firmware build is involved.

## Verified locally

`make zmk-build`: PASS, 8/8 exports compiled; intentional `audit_missing_connector` rejected by Devicetree. `make check`: PASS, 138 files / 859 tests, coverage floors unchanged. CI workflow is configured; no remote CI run is claimed. Logs and build artifacts are under ignored `.zmk-build/logs` and `.zmk-build/artifacts`.

## Current execution policy — 2026-10-21

Firmware compilation is local-only through `make zmk-build`. CI no longer contains or requires a `zmk-build` job. Keep local build evidence for generator/export changes under docs/commands.md. Earlier CI references above describe historical implementation evidence.

Follow-up verification: full Docker `npm run check` passed, including unit tests, coverage floors, types, lint, formatting and tooling contracts (`.zmk-build/pr15-local-firmware-check.log`). Ruby YAML parsing confirmed exactly check/e2e/image/mutations with PR-only triggers; `make -n zmk-build` confirmed the unchanged local export-generation and pinned Docker build commands; `git diff --check` passed. No firmware compilation or browser rerun was performed for this workflow/docs-only change.

GitHub API verification confirmed the four required check names and strict/up-to-date mode. Comparing complete branch protection before/after, excluding the required-status list, confirmed every other setting unchanged. PR #15 remains draft pending its existing manual acceptance.
