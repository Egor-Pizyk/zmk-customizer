# Research: Matrix Wiring Editor

## R1 — One actual wiring

Decision: matrix editing rewires actual schematic connections; terminal identity orders buses, while getNets derives key membership. This is the user's accepted answer. Rationale: schematic and generated firmware must agree. Alternatives: export-only mapping mode or read-only net ordering; neither matches the accepted workflow.

Evidence: src/domain/get-nets.ts, derive-shield-matrix.ts and types.ts. Current cells are derived, not persisted. The current minimum-GPIO graph coloring and sorted pin arrays would renumber axes after a GPIO change, so terminal identity must be independent of pin number.

## R2 — Migration without rerouting

Decision: v6→v7 leaves all path geometry/insulation untouched. Seed ordered buses from successful legacy derivation on the first editor edit, attaching identities without changing routes. Migration itself only bumps the schema version, preserving legacy endpoint content exactly. Keep invalid/incomplete circuits loadable with issues and explicit initialization. Rationale: old output and user routes are product contracts. Alternative: reroute all projects at load; rejected because it changes user content and may introduce shorts.

## R3 — Router verified by electrical membership

Decision: bounded deterministic routing of affected nets plus dependent junctions, followed by actual getNets verification. Explicitly insulate new inter-bus crossings and refuse any inter-bus collinear overlap. Preserve unaffected routes. Rationale: find-wire-contacts.ts connects overlaps unconditionally and connects perpendicular interior crossings unless stored insulation excludes them. Endpoint touch alone is not a junction. Horizontal-first corners in get-wire-path.ts can cause accidental contacts for rotated/coincident pin coordinates.

Alternatives: naive star routing (introduces shorts); ignoring geometric contacts (breaks existing schematic meaning); adding a general router library (unnecessary dependency). The domain tests must first demonstrate safe routing for staggered/rotated keys and crossings with existing paths. No route is trusted because its DTO looks correct.

## R4 — Ground and independent halves

Decision: ground is an explicit non-GPIO terminal. Half ownership applies to terminal references, key assignments and wire connectivity; same GPIO on independent halves is legal. Cross-half explicit wiring is invalid, and mere geometric overlap between independent circuits does not join them. Rationale: current types lack GND/half and getNets operates globally. Alternatives: treating GND as a magic GPIO or assigning right-side pins artificial numbers; rejected as false controller data.

Direct contract: docs/zmk/kscan.md, direct switches to GND, active-low plus pull-up, RC(0,input index). Split contract: docs/zmk/matrix-transform.md and shield-files.md, right offset uses left columns, central identity only left, config shared conf resolution. Same board/scanning type for both halves limits first delivery; BLE-only avoids inventing experimental wired transport.

## R5 — Predictable initial assignments

Decision: rotated physical centers, center-x midpoint for halves (ties left), grid-quantized center-y rows and contiguous column indices by center-x rank within each row (no x quantization). Rationale: reproducible visible starting point with explicit manual correction. Alternative: topology prediction for arbitrary clusters; impossible from positions alone. Legacy preset electrical order remains untouched until requested auto-assignment; each preset must have an independently tested equivalent with documented row/column permutations and preserved key-to-pin connections. If the heuristic cannot preserve a preset's nets by a consistent permutation, retain the preset's known assignments for that preset instead of claiming an equivalent.

## R6 — Verification

Decision: tests first for electrical operations/storage/generators; real App interaction and isolated Playwright actual files; build direct, both matrix directions and both split halves. Rationale: tests that inspect only stored assignments miss shorts and wrong downloaded firmware. Preserve existing coverage floors and actual-export targets. Controlled regression probes run alone with exact restoration.

Read-only research agent inspected the existing files; findings incorporated above. No runtime dependency or upstream fixture changes are proposed.

Implementation refinement: imported matrices are also bounded to 8192 grid cells per half using the existing processing budget; editor operations refuse dimensions needing more GPIOs than the selected board exposes. This bounds rendering work and rejects physically impossible dimension changes before routing.
