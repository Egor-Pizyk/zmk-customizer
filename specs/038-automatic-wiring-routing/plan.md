# Plan: Automatic wiring with grouped outputs

## Summary and technical context

Pure TypeScript, existing Project/Wire endpoints and geometry, React UI copy only, no dependencies. Build deterministic local matrix-net trees on Rebuild and automatic matrix mode/topology reconstruction. Keep legacy direct/partial/manual routing unchanged. No schema or generator syntax changes.

## Constitution check

Pass before/after design: immutable pure domain; deterministic input/output; no I/O/network/runtime dependency; existing versioned schema unchanged; keyboard preview/history remain; verified ZMK v0.3 kscan/matrix transform preserved. User explicitly keeps work on fix/pre-major-sweep, despite ordinary one-new-feature branch convention. Unrelated staged editor resize edits are excluded from commits.

## Relevant context

AGENTS startup documents, docs/architecture.md, folder-structure.md, tooling.md, domain-model.md; guidelines code-quality TypeScript/control-flow/naming/observability; React/accessibility/admin-ui/Tailwind; testing.md/commands.md/git-flow.md; docs/zmk/README.md, kscan.md and matrix-transform.md. Existing 032/033 specs and 036 FR-029 own replaced output positioning and sole Rebuild action. Read Wire geometry/contact/net contracts and existing wiring regression tests.

## Design

1. New private editing helpers: get-grouped-output-positions.ts builds a horizontal row block 1u above each half and a vertical column block 1u beside its exterior edge. Each has 1u pitch; obstructions shift rows upward and columns outward independently in bounded 0.5u steps. Row labels rotate upward. Row output leads start upward and arrive vertically; vertical detour lanes preserve safe routing. This supersedes 032's scattered output placement for MATRIX REBUILD only; direct/partial operations retain old rules.
2. route-matrix-wiring.ts groups expected contacts by terminal, preserves getRetainedWires, and uses deterministic Manhattan nearest-tree growth. Seed each net with its first contact and connect remaining keys to nearest existing keys. Build all local trees first, then attach each output to the nearest feasible key contact. Exactly one terminal endpoint per net. Existing key-pin and junction-free representation needs no migration. Validate refs, budgets and independent net correspondence before return.
3. find-matrix-route.ts evaluates bounded orthogonal L/dogleg/detour candidates. get-route-path-cost.ts rejects unintended key/encoder pin contact, all collinear overlap and same-net intersections away from explicit contact joins; crossings permitted with insulation, score length + bend/crossing penalty. No global optimality claim. Candidate coordinates include clearance rails around contacts and start/end escape channels. Stable tie-breaks preserve determinism.
4. Intent labels per wire from its tree/retained net determine crossing insulation, rather than treating children without terminal endpoints as unlabelled. Reuse findWireContacts/getNets/resource validation for independent final electrical checks.
5. edit-wiring.ts invokes new router on auto/mode/topology + matrix. UI/onboarding explain local lines and two blocks, without new controls or effects.

## Validation

Tests first: domain 3×3/6×6 length vs independently defined former star baseline, exact net contacts, output count/alignment/clearance; irregular/rotated/split presets, retained circuits, coincident pin refusal, determinism/input immutability, direct compatibility and limits. Browser real Rebuild preview/Cancel/Apply/Undo/Redo/reload/downloaded JSON, rendered output groups, both themes and 1024/1440 plus representative cross-browser. One journal verification.md holds traceability and exact check receipts. Direct tests for red/green diagnosis; final staged check required. Generator source unchanged: existing output golden contracts retain correctness; no new ZMK syntax to compile.

## Implementation phases

US1 safe local trees → US2 output grouping → US3 copy/browser review → changed checks/delivery. Support files split by responsibility and max 40-line functions, no new public module aliases unless a distinct responsibility warrants them. Existing editing barrel remains public API.

Rendered review refinement: reserve output-label rectangles in path scoring and include their clearance rails in detour candidates. Shared get-board-pin-labels.ts carries optional text anchor for exterior labels; schematic-screen-layer.ts renders outward/upward text in local coordinates inside translated/rotated SVG groups, preserving correct cross-engine text bounds. No persistent data or unrelated label style changes.

Straight-line refinement: route all key-contact trees first, then one output lead per terminal in a second pass. Seed each tree with its first contact; grow deterministic nearest-contact connections. Prefer a valid direct segment for aligned contacts over bend/crossing penalties. Score same-net positive-length collinear overlaps as forbidden as well as different-net overlaps, while permitting shared same-net endpoints. Preserve top/side output placement and vertical row lead rules. Add independent segment-overlap and regular-grid straight-edge tests before implementation, then repeat rendered preview/history review and staged checks. No schema, dependencies, UI controls or generator changes. Analysis: FR-001/002/004/005 map to T012–T014; safe perpendicular crossings remain insulated; new same-net overlap prohibition supersedes the prior permissive scorer.
