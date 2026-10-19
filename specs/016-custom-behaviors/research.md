# Research: 016

Decision: retain inline behavior types and add reusable definitions. Rationale: old data and golden output are contracts. Alternative rejected: rewrite every inline binding during migration.

Decision: reference IDs and typed parameters. Rationale: renaming cannot invalidate users; ZMK hold-taps forward exactly two cells and sticky behaviors one. Targets restricted to zero/one-cell built-ins. Alternative rejected: raw Devicetree or untyped parameter strings.

Decision: source facts from verified v0.3 notes. Custom hold-taps must explicitly emit tapping-term-ms; sticky variants must explicitly emit release-after-ms and booleans. No layer locking. No unresolved research questions.
