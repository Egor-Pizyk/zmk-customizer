# Feature Specification: Firmware Kconfig settings

**Feature Branch**: `015-kconfig-settings`
**Created**: 2026-10-17
**Status**: Implemented and technically verified; manual accessibility gate pending
**Input**: Roadmap 015 — typed, explained, searchable Firmware settings for pinned ZMK v0.3.0.

## Goal and scope

Builders configure common firmware behavior without writing Kconfig. Settings survive saving, loading and undo, and produce deterministic configuration containing only changes from applicable defaults.

**In scope**: General/HID, USB output behavior, BLE connection behavior, sleep/idle, debounce, battery reporting and supported two-half BLE split options. Boolean, integer, choice and string controls; descriptions, defaults, exact pinned documentation links and search.
**Non-goals**: Arbitrary Kconfig text; board-owned USB/BLE enable switches; split topology/roles (owned by Schematic); wired split hardware; encoders, lighting, displays, Studio, logging, pointing hardware and undocumented low-level tuning.
**Existing contracts to preserve**: Old project files, immutable edits, session undo/redo, autosave, offline operation, keyboard access and validated export; shield hardware defaults remain in Kconfig.defconfig.

## User scenarios and acceptance

### US1 — Find and configure firmware behavior (P1)

1. Given a project, opening Firmware shows grouped typed controls, current and applicable default values, descriptions and pinned documentation links.
2. Searching by label, symbol, category or explanation filters controls; clearing the search restores them; no matches shows a readable empty result.
3. A user changes a switch, integer, choice or string using keyboard alone, then sees the same values after undo/redo, save/open and reload.
4. Irrelevant hardware options explain their requirements; changing hardware preserves overrides and reports incompatible non-default settings rather than silently discarding them.

### US2 — Diagnose and repair configuration (P1)

1. Committing an out-of-range integer preserves it, shows an inline error, a Firmware issue badge and a Problems entry, and blocks ZIP export.
2. Activating a Firmware problem navigates to Firmware, clears filtering if necessary and focuses the affected control.
3. Correcting or resetting the option clears its errors and permits export when all other errors are fixed.
4. A malformed imported value is rejected without replacing current work; a structurally valid but semantically invalid value opens with actionable validation issues.

### US3 — Export only intentional overrides (P1)

1. Default project firmware settings add no CONFIG lines. Changed settings appear once, sorted by emitted symbol, in config/<shield>.conf.
2. Restoring the applicable default removes its CONFIG lines, including choice member overrides; strings escape quotes/backslashes safely.
3. A split export normally shares user configuration in config/<shield>.conf. Central-only overrides instead produce config/<shield>_left.conf and config/<shield>_right.conf, omit the shared file, and put central-only settings on the left. Topology and role defaults remain scoped in Kconfig.defconfig.

## Requirements

- **FR-001** (US1): Provide bool/int/enum/string settings for the supported inventory recorded in the catalog contract. Every entry has label, category, one-line description, applicable default and pinned docsUrl.
- **FR-002** (US1): Search case-insensitively across labels, symbols, categories and descriptions, with a clear search and explicit empty result.
- **FR-003** (US1): All edits/reset operations preserve unrelated project data, support undo/redo, autosave and versioned JSON round trips; old v1–v7 files migrate with no firmware overrides.
- **FR-004** (US2): Validate kind, safe integer/range, choice membership and single-line bounded strings; report unknown symbols, incompatible board/topology and dependent-setting conflicts. Preserve repairable values and block invalid exports.
- **FR-005** (US2): Firmware issues appear inline, in its workspace badge and Problems, whose activation focuses the control even when a search would hide it.
- **FR-006** (US3): Emit only values differing from applicable defaults, deterministic symbol sorting, y/n booleans, decimal integers, escaped quoted strings and selected choice member; keep hardware defaults in defconfig.
- **FR-007** (US1–3): Native controls are labeled, keyboard reachable and visibly focused; explain units, valid ranges, dependencies and reset behavior. Draft fields commit on blur/Enter, cancel with Escape and never undo the project while typing.
- **FR-008** (US1–3): Catalog/output targets ZMK v0.3.0; no main-only, unprompted board-owned or unsupported DT-dependent options. Do not imply that output selection enables missing USB/BLE hardware.

## Edge cases

Empty search; Unicode text; quote/backslash/newline string input; NaN/fraction/negative/excessively large integers; unknown imported option; wrong primitive type; disabling battery reporting with dependent overrides; sleep on unsupported boards; split-only settings on unibody; controller/topology changes; default changes after hardware changes; resetting an unknown override; repeated no-op edits; empty numeric draft cancellation; split shared/per-half configuration.

## Key entities

A firmware option defines a supported build setting, its type/default/constraints and documentation. A project stores explicit overrides keyed by catalog identity. Validation issues locate one override and explain how to repair it.

## Success criteria

- **SC-001**: All supported options expose description/default/docs and are found by a symbol or label query.
- **SC-002**: All four control types retain exact committed values through undo/redo, reload and JSON download/open.
- **SC-003**: Independent output fixtures prove sorted non-default-only CONFIG lines and escaped strings, including split export.
- **SC-004**: Each added validation class blocks export and offers a focused repair path.

## Assumptions and open questions

Clarify audit (2026-10-17): no material ambiguity requires a user question; authorization permits reasonable scope defaults. Raw Kconfig is excluded. Board-owned ZMK_USB/ZMK_BLE are not offered; USB boot protocol and HID report choice cover output behavior. Bluetooth defaults depend on supported boards; connection counts are excluded from shared split .conf because central/peripheral defaults differ and shared configuration cannot safely tune both. Two-half split count/roles remain hardware-owned; battery fetching/proxy are supported together on the central through conditional Kconfig dependencies. Settings must not force central-only symbols on peripherals. Product bounds are conservative and explicitly distinguished from upstream Kconfig ranges. No unresolved questions.
