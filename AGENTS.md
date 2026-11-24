# ZMK Customizer

Static browser application for keyboard design and ready-to-build ZMK v0.3.0 shields. Optional GitHub publishing uses a stateless authorization service.

## Work directly, keep feedback fast

- Start with the user's request and `git status --short`. Search the relevant code/tests; implement without creating specs, plans, tasks, behavior matrices or verification journals. No Spec Kit, feature resolver or mandatory review stages.
- Make a coherent change, then run the smallest useful check immediately. Focused tests are allowed from the first edit. Use watch mode for repeated work; broaden only for shared/broad changes, failures or unresolved risk. Full units, coverage, browser matrices and mutation suites belong to CI or explicit risk-driven verification, not every task.
- Prefer a focused unit/integration regression. Use one real-browser scenario when native hit testing, gestures, layout or browser behavior is the problem. Test business/data risks; skip trivial wrappers, literal/copy/style snapshots and tests written only for coverage.
- Reuse checks for unchanged code. Documentation-only work needs link/instruction checks, not product tests. Do not wait for unrelated suites or CI to provide feedback.
- Keep progress and final replies concise: result, checks and material limits. No per-task documentation, test-count inventories or evidence receipts unless requested. Update docs only when a durable project contract or setup actually changes.
- Preserve existing edits; stay within the request. Work on the current branch unless isolation is needed. Commit/push when requested; merging and release are separate actions.

## Project constraints

- Target pinned ZMK v0.3.0. Before changing emitted syntax/catalog facts, read only the relevant verified `docs/zmk/` note and independent fixture. Never emit main-only features or invent syntax from memory.
- One plain-JSON `Project`; pure immutable domain operations; deterministic generators. Preserve existing files, stable identities and Undo/Redo. Schema changes require migrations and old-file tests.
- Business rules: domain. ZMK facts: catalog. Untrusted input: storage. UI renders and dispatches. Follow existing public module aliases; `tsconfig.json` is their registry.
- Preserve keyboard access and existing user data. Update onboarding only when affected controls/flows change. Keep runtime dependencies intentional; record a short ADR for a new dependency or changed architecture.
- Do not use Computer Use or ordinary browser profiles without an explicit request. Isolated Playwright tests are allowed. Report only checks actually performed; never commit generated reports, dist or node_modules.

## Load context only when needed

This file is the complete startup context. Do not preload linked docs, all guidelines or ADRs. Follow a link only to answer the next concrete question; reuse unchanged context across follow-ups.

| Need | Reference |
|---|---|
| Commands / focused checks / Docker | `docs/commands.md` |
| Which behaviors need tests | `docs/testing.md` |
| Layer or module boundary | Relevant section of `docs/architecture.md`, `docs/folder-structure.md` |
| Project/ZMK concepts | `docs/domain-model.md`; relevant `docs/zmk/` page |
| Code convention | Applicable section under `docs/guidelines/`; do not read the whole tree |
| UI styling | Existing `src/styles.css` tokens; relevant frontend guideline |
| Product scope | `docs/product.md`; roadmap only for future product questions |
| Commit, PR or release | `docs/guidelines/git-flow.md` |

The request, code and meaningful tests define the work. Documentation supplies project facts, not an implementation approval process. Resolve conflicts with the user's explicit scope; no feature number or artifact directory is required.
