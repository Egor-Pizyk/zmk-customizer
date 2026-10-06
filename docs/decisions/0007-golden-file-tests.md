# 0007. Golden-file tests of generators against upstream ZMK shields

Status: Accepted
Date: 2026-09-27

## Context
The main risk is output that looks right but does not build or behaves differently on the device. Upstream ZMK shields (e.g. `corne`) are known to build and follow ZMK conventions.

## Decision
Every generator has golden-file tests: a project equivalent to an upstream shield is generated and compared byte for byte with expected files under `tests/fixtures/`, which are built from the upstream shield files at the ZMK version pinned in `docs/zmk/README.md`. Every generator change comes with a golden test change.

## Consequences
- Generators must be deterministic (stable ordering, `\n`, trailing newline).
- Updating the pinned ZMK version means updating fixtures and catalog in one change.
- Upstream files contain parts we do not generate; how expected files relate to verbatim upstream files is settled in feature 007 shield-generators (`docs/roadmap.md`).
- Golden tests prove equivalence with upstream, not that the build passes; a real build check is roadmap feature 022 build-verification (017 before the 2026-09-28 renumbering, 020 before 2026-10-06).
