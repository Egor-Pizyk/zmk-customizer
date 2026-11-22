# Focused local checks

## Goal

Reduce repeated manual test selection and log reading during implementation, before the existing mandatory final check. Developer tooling only; no application or user-data changes.

## Requirements and acceptance

- **FR-001**: `npm run check:focus` checks the exact staged snapshot; `--base REV` retains the existing committed-HEAD comparison. Preserve partial staging, deletions, working tree and index; no stashing or runtime dependency additions.
- **FR-002**: Select dependency-related unit tests and explicit browser journeys for supported UI areas. Parts/layout/encoder changes include keyboard editing, project/import, onboarding and repair paths. Shell/project changes include creation, import and keyboard/onboarding. Include directly modified E2E tests. Unknown source areas, global inputs, shared test helpers and deletions conservatively select the complete browser suite. Explain selection and fallback reasons; selection is a diagnostic heuristic, not exhaustive impact proof.
- **FR-003**: `--plan` prints the snapshot, changed files, selected checks and reasons without Docker/test execution or reports/receipts. Read file existence from the selected Git tree, not unstaged working bytes.
- **FR-004**: Focus mode has isolated logs/cache and never creates or reuses the final check's passed receipt. Existing `check:changed`, pre-commit and CI retain conservative behavior. A failed forced rerun invalidates only the corresponding mode's old receipt.
- **FR-005**: Every executed check records status, duration and full-log path in `summary.json`; failures include a bounded excerpt and nonzero exit. Compact terminal output points to complete logs. Reports explicitly identify focus diagnostics versus final checks and never claim token counts or coverage they did not measure.
- **FR-006**: Document code → static checks → adapt tests → focus/plan → final check. Scripts assist selection/execution/reporting, not semantic test adaptation or guarantees. Exact-tree successes may be reused within their mode only; final gates remain mandatory.

Acceptance: Parts edit produces a smaller explained browser selection including both previously missed encoder/Bindings and onboarding accessibility paths; an unknown UI/global/helper edit falls back to all. Plan works with Docker absent and partial staging. Focus success cannot satisfy the final hook; failure records evidence and restores no files because nothing was mutated.

## Scope limits

No per-step cache, timing-based test omission, automatic test rewrites, AI calls, new services, application UI, coverage relaxation or changed CI gates. Start with bounded UI mappings; unknown cases stay broad. No material open questions; existing project principles unchanged.
