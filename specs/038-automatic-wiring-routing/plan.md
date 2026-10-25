# Plan: Automatic wiring with grouped outputs

## Summary and technical context

Pure TypeScript, existing Project/Wire endpoints and geometry, React UI copy only, no dependencies. Build deterministic local matrix-net trees on Rebuild and automatic matrix mode/topology reconstruction. Keep legacy direct/partial/manual routing unchanged. No schema or generator syntax changes.

## Constitution check

Pass before/after design: immutable pure domain; deterministic input/output; no I/O/network/runtime dependency; existing versioned schema unchanged; keyboard preview/history remain; verified ZMK v0.3 kscan/matrix transform preserved. User explicitly keeps work on fix/pre-major-sweep, despite ordinary one-new-feature branch convention. Unrelated staged editor resize edits are excluded from commits.

## Relevant context

AGENTS startup documents, docs/architecture.md, folder-structure.md, tooling.md, domain-model.md; guidelines code-quality TypeScript/control-flow/naming/observability; React/accessibility/admin-ui/Tailwind; testing.md/commands.md/git-flow.md; docs/zmk/README.md, kscan.md and matrix-transform.md. Existing 032/033 specs and 036 FR-029 own replaced output positioning and sole Rebuild action. Read Wire geometry/contact/net contracts and existing wiring regression tests.

## Design

1. New private editing helpers: get-grouped-output-positions.ts builds two vertical exterior blocks per half. Row block 1u from key bounds; column block 5u farther outward. Each block has constant x and 1u label pitch; key/other-label obstructions shift the entire pair outward together in bounded 0.5u steps. This supersedes 032's scattered output placement for MATRIX REBUILD only; direct/partial operations retain old rules.
2. route-matrix-wiring.ts groups expected contacts by terminal, preserves getRetainedWires, and uses deterministic Manhattan nearest-tree growth. Every added key connects to the nearest existing key (or the output for the first key). Exactly one terminal endpoint per net. Existing key-pin and junction-free representation needs no migration. Validate refs, budgets and independent net correspondence before return.
3. find-matrix-route.ts evaluates bounded orthogonal L/dogleg/detour candidates. get-route-path-cost.ts rejects unintended key/encoder pin contact, different-net collinear overlap; crossings permitted with insulation, score length + bend/crossing penalty. No global optimality claim. Candidate coordinates include clearance rails around contacts and start/end escape channels. Stable tie-breaks preserve determinism.
4. Intent labels per wire from its tree/retained net determine crossing insulation, rather than treating children without terminal endpoints as unlabelled. Reuse findWireContacts/getNets/resource validation for independent final electrical checks.
5. edit-wiring.ts invokes new router on auto/mode/topology + matrix. UI/onboarding explain local lines and two blocks, without new controls or effects.

## Validation

Tests first: domain 3×3/6×6 length vs independently defined former star baseline, exact net contacts, output count/alignment/clearance; irregular/rotated/split presets, retained circuits, coincident pin refusal, determinism/input immutability, direct compatibility and limits. Browser real Rebuild preview/Cancel/Apply/Undo/Redo/reload/downloaded JSON, rendered output groups, both themes and 1024/1440 plus representative cross-browser. One journal verification.md holds traceability and exact check receipts. Direct tests for red/green diagnosis; final staged check required. Generator source unchanged: existing output golden contracts retain correctness; no new ZMK syntax to compile.

## Implementation phases

US1 safe local trees → US2 output grouping → US3 copy/browser review → changed checks/delivery. Support files split by responsibility and max 40-line functions, no new public module aliases unless a distinct responsibility warrants them. Existing editing barrel remains public API.

Rendered review refinement: reserve output-label rectangles in path scoring and include their clearance rails in detour candidates. Shared get-board-pin-labels.ts carries optional text anchor for exterior labels; schematic-screen-layer.ts renders outward text. No persistent data or unrelated label style changes.
