# Implementation Plan: Schematic diodes

## Technical Context
TypeScript/React, existing SVG canvas and native buttons; no new dependencies. Pure domain rules, storage parsing only, semantic Tailwind tokens.

## Constitution Check
Pass: domain-first, plain JSON, schema migration, test-first, accessible table alternative, no runtime network or speculative generator. No ZMK syntax is emitted in this feature. Reference: docs/zmk/kscan.md, diode direction table.

## Design
Key gains optional diode { pin: 1 | 2, cathode: 'toward-switch' | 'away-switch' }. Project schema version 4; migrate v3 to v4 without creating diodes. Domain toggle enforces one diode; reversal changes cathode only. A query returns from/to pin for future matrix derivation. Existing getNets continues to represent the external wiring nets.
Native buttons in the existing unscaled canvas screen layer, same pattern as crossing controls; hide below 50% zoom, table remains available. Diode symbol is world-space and follows pin position. Buttons are separated from wire hit targets.

## Files and verification
src/domain/types.ts, toggle-key-diode.ts, reverse-key-diode.ts, get-key-diode-state.ts, find-key-current-flow.ts; adjacent tests.
src/storage/project-schema.ts, migrate-v3-to-v4.ts, migrate-project.ts; old-file and malformed-input tests.
src/ui/schematic/diode-symbol.tsx, diode-buttons.tsx, diode-controls.tsx; canvas/table integration and render/interaction tests.
Update docs/roadmap.md: insert 008; shift planned features by one. Future shield generation uses flow direction to constrain bipartition orientation; conflicts are errors and never guessed. Actual ZMK generation remains next feature.

## Sequence
Tests red → domain/storage → canvas/table → regression and visual checks → make check.

Follow-up correction: preserve getWirePath/getNets geometry; draw both leads outside the polarity rotation; final attachment coordinates are defined by the corrected implementation below. Validate free endpoint contacts using existing pin coordinates; leave explicit wire-junction and insulated crossing semantics unchanged. End caps derive danger styling from actual validation marks. Add regression tests before corrections, then make check.

Corrected attachment implementation: derive presentation diode placement from original wire paths, render a 0.32u series symbol from pin toward wire, and resolve displayed wire paths with temporary external terminal endpoints. Reuse these display paths for wire hover/hit projection. Keep electrical domain paths untouched. Add tests for four directions, both polarities, pin-side and wire-side attachments, common terminal and no persisted mutations.
