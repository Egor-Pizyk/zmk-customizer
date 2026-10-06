# 0010. Generated output targets ZMK v0.3

Status: Accepted
Date: 2026-09-27

## Context
ZMK has two relevant lines. `v0.3.0` (tag `edf5c08`, 2025-08-01, Zephyr 3.5, hardware model v1) is the latest release and is what the official `unified-zmk-config-template` and existing shield generators pin. `main` (Zephyr 4.1, hardware model v2) is what zmk.dev documents and will become `v0.4`. Shield sources are the same on both; board ids in `build.yaml` (`nice_nano_v2` vs `nice_nano//zmk`), board overlay file names inside the shield, the `west.yml` revision and the workflow ref differ, and `main` has behaviors/Kconfig options that v0.3 lacks.

Users take our zip, push it to GitHub and expect the build to pass with the template they already have.

## Decision
- Everything we generate targets **ZMK v0.3.0**: board ids, board overlay names, `config/west.yml` `revision: v0.3`, workflow ref `v0.3`, and only behaviors/properties/Kconfig options that exist at the `v0.3.0` tag.
- `docs/zmk/` notes and `tests/fixtures/upstream/` are verified against the `v0.3.0` tag. Anything that exists only on `main` is marked "main only" and must not be generated or offered in the UI.
- User-facing docs links (`docsUrl` in the catalog) use the v0.3 docs site **https://v0-3-branch.zmk.dev/docs/** (built from branch `v0.3-branch` = v0.3.0 + docs-only commits). `zmk.dev` describes `main` and is not linked from the UI.
- Version-dependent values (board ids, board overlay names, `west.yml` revision) live in catalog data, never hardcoded in generator code, so a later switch is a data change.

## Consequences
- Output builds with the official template as-is.
- Newer ZMK features (e.g. layer `locking`, HWMv2 board ids) are unavailable until we move targets.
- Moving to v0.4 = new ADR superseding this one + re-verified `docs/zmk/` + re-fetched fixtures + catalog update, in one change. Supporting several versions at once is roadmap feature 021 zmk-version-selection.
