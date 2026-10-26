# Verification

Base: origin/main ee99a9a; branch feature/039-focused-local-checks in a separate worktree. User-requested tooling is isolated from active UI PR #29; original worktree preserved. No application UI/onboarding behavior, schema, generators or runtime dependencies change, so no rendered/manual UI acceptance or firmware build applies.

FR-001/003/004: subprocess Git tests cover partial staging, tree-based existence, plan without Docker/reports, distinct focus/final cache execution, forced failure invalidation and index/working-file preservation. FR-002: selection tests cover bounded UI mappings, cross-cutting keyboard/accessibility/onboarding, changed-spec union and unknown/shared/global/deleted fallbacks. FR-005: worker tests cover success and bounded failure reports, timings, complete logs and concise stderr. Tests were added before implementation; initial missing-module/report failures and then direct-spec selection regression were fixed. Direct Node test runs diagnose these orchestration boundaries without Docker overhead.

FR-006: commands/testing/agent rules explain focus-before-final workflow, limits, reports and mapping ownership. No claim of measured token savings: the tool reduces repeated test/output work; semantic assertion updates remain manual. Final coverage policy is unchanged (ADR 0021).

Docker diagnostic: focus tree bf53ec7c4d4b passed in 9.511s (static checks, changed-file lint/format, all 112 tooling tests); logs `.check-logs/focus/bf53ec7c4d4b-ee99a9a39b3a/summary.json`. Tooling/tests/docs were staged while the npm entry remained unstaged, exercising exact partial staging without repeating broad package-triggered suites. An earlier focus run caught three lint issues; fixed the intentional ANSI matching annotation and string-prefix/suffix checks, then reran successfully.

Final tree 392a864c56ff915ada2545fe0da33776db008db5 includes package.json. Static checks and 112 tooling tests passed; all 247 unit files / 1412 tests passed in 47.50s. All 138 Chromium journeys passed (3.6 minutes); total final execution 285.805s. Exact-tree pre-commit receipt reused successfully. Full logs `.check-logs/392a864c56ff-ee99a9a39b3a/`; no CI result claimed.

Standalone eight orchestration tests also passed in 4.03s. Plan preview produced JSON without a Docker execution. Spec/plan/tasks and documentation reviewed against implementation; final planner behavior preserved. Reporting-only task/journal updates after the checked tree follow the documentation route.
