# Verification — 2026-10-14

- Nested module contracts were added before implementation: four expected failures demonstrated the previous parent-module ownership policy. Updated architecture fixtures retain forbidden low-level UI imports through named, namespace, dynamic and indirect re-exports.
- `make check`: passed; 174 Vitest files / 1016 tests, all coverage floors, typechecks, architecture/guideline gates, lint and formatting passed.
- Production build through `infra/compose.yaml`: passed. Vite reports the existing large bundle warning; no bundle splitting was added to this structural task.
- `make image`: passed; relocated production Dockerfile, Dockerfile-specific context exclusions and nginx COPY path work.
- `make test-e2e`: passed, 84 tests without retries: complete Chromium suite (44), targeted Firefox (20) and WebKit (20).
- `make zmk-build`: passed; all 19 deterministic actual-export targets compiled against pinned ZMK v0.3, with the intentional invalid-connector build correctly rejected.
- All three Compose configurations validate. Mandatory AGENTS imports resolve and explicitly cover every guideline and ADR. Only specs/README.md is imported; every populated source group has its own index (vendored raw catalog assets are exempt).
- `git diff --check`: passed. Dependencies, schema, runtime behavior and generated syntax are unchanged.

## Coverage and limits

| Scenario | Risk | Existing coverage / visible assertion | Saved/exported assertion |
|---|---|---|---|
| Nested API migration | Wrong symbol ownership, cycles, or bypassed layer restrictions | Tooling positive/negative import contracts, resolved export tracing, lint cycle gate; real app interaction tests | Existing golden files and persistence contracts |
| Layout/bindings/wiring composition | Import changes break controls, previews or focus | Full production browser suite verifies visible layout, selection, editing, history, dialogs and native inputs | Actual JSON/ZIP downloads and reloaded project assertions |
| Infrastructure relocation | Wrong contexts, mounts, ignore rules, nginx path or firmware entry points | Compose validation, production build/image and isolated browser runner | 19 actual shield builds and intentional connector rejection |
| Agent context extraction | Missing mandatory rules or eager feature loading | Explicit guideline/ADR import inventory and file existence audit | Feature directory links retained in specs/README.md |

No user journey or interaction contract changed, so no new E2E tests or three-run validation of changed E2E tests was required. Mutation scripts retain their existing scenarios and have updated source/test/Compose paths; mutation suites were not run because no behavioral contract changed. Browser reports remain in ignored playwright-report/ and test-results/; firmware evidence remains in ignored .zmk-build/logs and .zmk-build/artifacts.
