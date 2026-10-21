# Research method and decisions

2026-10-21. Scope is research only, per the user's explicit restriction.

- **Decision**: Combine source/owning-contract review with isolated production-browser observations. **Rationale**: Source inspection can prove missing capability or explain a preview lifecycle, but cannot prove scattered paint or successful pointer interaction. **Alternative**: Treating all 21 reports as confirmed regressions would erase contract changes and unverified conditions.
- **Decision**: Preserve the existing design system. **Rationale**: This is an audit of a dense keyboard editor, not a new visual direction. **Alternative**: A generated replacement palette/type system would add unrequested scope.
- **Decision**: Keep temporary investigation scripts outside tracked source/tests. **Rationale**: The user prohibits code changes. Existing E2E journeys provide bounded current evidence; future fixes require committed regression tests in 036. **Alternative**: Adding tests now would violate the requested boundary.
- **Decision**: Keep manual gaps visible. **Rationale**: Linux browser automation does not establish macOS clipboard operation, native zoom or speech output. Prior user confirmation covered 012, not this whole audit. **Alternative**: Treating viewport emulation as native zoom would overstate evidence.

Local UI/UX guidance accepts visible/unobscured focus, semantic controls, labels and graceful long-text overflow. Existing 32px dense controls and WCAG 2.2 AA baseline override generic mobile 44px suggestions. Image placeholders, native haptics/safe areas and unrelated animation guidance are inapplicable. No new design-system source is generated. See the journal for searches and the findings register for actual outcomes.
