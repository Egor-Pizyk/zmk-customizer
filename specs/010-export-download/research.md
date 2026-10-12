# Research — 010

## R1 Repository layout and release

Decision: docs/zmk/README.md and shield-files.md §1–2/6 specify root boards/shields, zephyr/module.yml board_root '.', config/west.yml revision v0.3, and reusable build-user-config.yml@v0.3. Use flat nice_nano_v2 board id and include build target with shield name. Keep shield default keymap and add config user keymap; relocate user conf to config only.
Rationale: module discovery and config override search match upstream v0.3. No manual file relocation.
Alternatives: legacy config/boards path and main revision rejected by ADR 0010. Split targets deferred to later domain support.
Sources: docs/zmk/shield-files.md §1–2/6; official unified template commit 09fce009cdf2f38fc3ae786e24c95b22cf78c79a; ZMK v0.3.0 build-user-config workflow.

## R2 Deterministic ZIP

Decision: approved fflate zipSync inside a deferred browser task, level 6, os 0, attrs 0, fixed local calendar mtime new Date(1980, 0, 1, 0, 0, 0), flat sorted path keys using code-unit comparator. Explicit metadata avoids clock defaults; fflate stores DOS time using local getters, so UTC ISO date would vary by timezone. Copy callback output into owned Uint8Array to satisfy typed Blob input.
Rationale: compression/CRC implementation is not a few lines; approved dependency. ZIP serializing belongs in storage, Date never enters project/generators.
Alternatives: custom ZIP writer rejected; direct synchronous handler rejected for pending interaction; worker-based async ZIP rejected because nginx CSP blocks blob workers; timestamp from current date rejected.
Source: https://github.com/101arrowz/fflate (ZIP API and src/index.ts ZIP writer).

## R3 Browser effects and feedback

Decision: shared downloadBlob builds temporary anchor, appends/clicks/removes it and revokes URL on a deferred task after click; immediately revoke if click fails. UI capture supplies files and filename before await. Ref locks repeated activation before re-render; React state renders busy. Browser clipboard writeText failures produce manual-copy guidance. Both announce and visible feedback use existing project announcement API without project commits.
Rationale: preserves browser user-gesture copy, resources and state. Existing text JSON downloads keep current API default.
Alternatives: File System Access API and hidden textarea clipboard fallback rejected as unnecessary and less portable.

## Clarification scan

No critical questions. Functional scope, domain/data, UX, quality attributes, integrations, errors, constraints, terminology and completion signals are clear. Volume follows existing project limits. Workflow default/on and transient scope are documented assumptions; release question is settled by pinned repository reference. No extensions.yml hooks are installed.
