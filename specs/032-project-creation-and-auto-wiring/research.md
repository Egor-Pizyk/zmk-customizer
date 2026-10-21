# Research — 2026-10-20

- Decision: only explicit Auto assign allocates pins. Existing `editWiring` creates unassigned axes; `createWiringTerminals` retains axis identities/pins. Preserve this behavior for ordinary edits. Alternative silent allocation on every edit would change unrelated user contracts.
- Decision: per-half rotated bounds replace global minX/minY. Existing `routeWiring` sends every endpoint left/up globally and already verifies actual nets/insulation. Keep those correctness gates.
- Decision: retain the six-key circuit only as independent test data, outside production catalog. Saved files contain ordinary Project fields, so removal does not require a migration.
- Decision: refuse invalid pins and insufficient capacity, confirmed by user. Preserve existing quantized-center row grouping; broader routing belongs to 033.
- UI guidance: local queries `keyboard focus modal --domain ux`, `dialog controlled state --stack react`, `responsive button group --stack html-tailwind` returned applicable focus/controlled-state/consistent-button sizing advice. Existing tokens and native modal take precedence over generic sample colors.
