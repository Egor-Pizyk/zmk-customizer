# Verification

Base: origin/main ee99a9a; branch feature/039-focused-local-checks in a separate worktree. User-requested tooling is isolated from active UI PR #29; original worktree preserved. No application UI/onboarding behavior, schema, generators or runtime dependencies change, so no rendered/manual UI acceptance or firmware build applies.

FR-001/003/004: subprocess Git tests cover partial staging, tree-based existence, plan without Docker/reports, distinct focus/final cache execution, forced failure invalidation and index/working-file preservation. FR-002: selection tests cover bounded UI mappings, cross-cutting keyboard/accessibility/onboarding, changed-spec union and unknown/shared/global/deleted fallbacks. FR-005: worker tests cover success and bounded failure reports, timings, complete logs and concise stderr. Tests were added before implementation; initial missing-module/report failures and then direct-spec selection regression were fixed. Direct Node test runs diagnose these orchestration boundaries without Docker overhead.

FR-006: commands/testing/agent rules explain focus-before-final workflow, limits, reports and mapping ownership. No claim of measured token savings: the tool reduces repeated test/output work; semantic assertion updates remain manual. Final coverage policy is unchanged (ADR 0021).

Actual Docker checks pending. For the real focus diagnostic, stage tooling/tests/docs first while leaving the npm entry unstaged, then stage the full package change for the required final gate. This exercises exact partial staging without running the broad package-triggered suites twice.
