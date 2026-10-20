# Git flow

This document owns Git delivery policy. Read it **before starting/resuming work or creating a feature/branch**, and **again after verification, before committing or delivering the result**. [Workflow](../workflow.md) owns SDD; [commands](../commands.md) and [testing](../testing.md) own verification.

## Before work

1. Inspect `git status --short`, the current branch, remotes and existing PRs. Preserve unrelated changes; use an isolated worktree if they would mix with this task. Never use blanket staging, resets or automatic stashing to absorb somebody else's work.
2. Choose the change route in workflow.md. Resolve Spec Kit context with `bash .specify/scripts/bash/check-prerequisites.sh --paths-only --json` and compare it to the request. Persisted selection is not ownership evidence: repository maintenance need not belong to the last selected product feature.
3. Fetch origin. Start work from current `origin/main`. Keep each feature in one branch and one PR targeting main.

## Branches and commits

Use lowercase ASCII kebab-case and `/` after the type. Git forbids `:` in branch names; colons belong in commit/PR titles. Use `feature` (not `frature`).

| Work | Branch example | Commit / squash title |
|---|---|---|
| Product capability | `feature/032-project-creation` | `feat: simplify project creation` |
| Bug fix | `fix/032-project-creation-cancel` | `fix: preserve project on cancel` |
| Documentation / specifications | `docs/032-project-creation` | `docs: specify project creation` |
| Independent tests | `test/controller-pin-coverage` | `test: cover controller pins` |
| Maintenance / dependency update | `chore/update-playwright` | `chore: update Playwright` |
| Behavior-preserving refactor | `refactor/wiring-queries` | `refactor: simplify wiring queries` |

For feature-related work, retain the exact `NNN-short-name` spec identifier. Work outside a feature uses a descriptive spec-like slug without inventing a spec number. Existing historical branches/directories need no rename. Dependabot-generated branch names are an exception.

Spec identifiers and Git branches are separate: keep `specs/NNN-short-name/` unprefixed. The installed Spec Kit creator creates the directory and selection state, not a Git branch. After resolving the identifier, create the appropriate typed branch. Do not put `feature/` into `SPECIFY_FEATURE_DIRECTORY`; use the exact spec directory. One feature has one branch and one PR containing its specification, implementation and tests.

Use Conventional Commits, one logical change per commit. Stage explicit files/hunks, inspect `git diff --cached`, and exclude unrelated work, secrets and generated output. Use `!` plus a `BREAKING CHANGE:` explanation for intentional incompatible changes.

## One feature, one PR

Use GitHub flow with short-lived branches targeting protected `main`. Keep specification, implementation, regression tests and verification for a feature in one PR. Do not create documentation/implementation/test stacks or intermediate releases for the same feature. This reduces delivery time, token use and repeated CI runs.

Tests-first still means observing the required failure locally before fixing it; include the passing regression test with its implementation. Documentation-only maintenance, independent fixes and dependency updates can have their own PRs because they are separate tasks. Split a feature only if the user explicitly requests it.

## Finish, commit and merge

Re-read this guide after implementation/verification. Delivery of authorized repository work includes scoped commits, push, PR creation and immediate merge submission unless the user explicitly requests local-only work, a draft/review stop or another boundary. Do not ask again for routine delivery permission.

Before submitting the merge:

- Inspect the final diff; satisfy the applicable SDD, UI review and verification gates. Record actual evidence and limits in the owning artifacts or PR for maintenance. A green CI result does not replace acceptance criteria or required manual checks.
- Give the PR a Conventional Commit title and a description of the problem, resulting behavior, relevant spec/tasks, checks and material limits. Explain the release increment.
- Set **exactly one** label: `release:patch`, `release:minor` or `release:major`, including for docs/test/chore PRs. Labels must be present before merge; branch type alone does not select a release.
- Require a main-based, non-draft PR with no unresolved blocking findings/conflicts and completed applicable local acceptance. Required manual checks or an explicit user review stop still apply.
- Submit the squash merge immediately after opening/updating the ready PR: `gh pr merge <number> --squash --auto --match-head-commit <head-sha>`. GitHub merges immediately when permitted or enables auto-merge while required checks finish. Do not poll CI, wait for workflows, or keep the agent turn open for CI/release completion.
- Branch protection still requires successful `check`, `e2e`, `image`, `mutations` and `zmk-build` for the final revision. Do not use `--admin` or change protection to force an early merge. If GitHub cannot accept the merge/auto-merge request, report the actual blocker without waiting or repeatedly retrying.

Main requires PRs, up-to-date status checks, resolved conversations and linear history; protection includes administrators, with force pushes and branch deletion disabled. No mandatory approving reviewer is configured for this solo workflow: agents review their diff and acceptance evidence before merging. Branch cleanup is explicit after merge.

If a check failure is already known, fix it within scope and rerun affected checks before submitting the merge. If access or infrastructure blocks delivery, report the precise blocker and leave an accurate PR/task state. In the final report distinguish local completion, auto-merge enabled, actually merged and release published. Never claim CI, manual checks or a release passed without evidence.

## One release per merged PR

Use the existing `.github/workflows/release.yml` and `scripts/create-release.mjs`. Each PR releases when it reaches **main**, with one release per feature PR; opening a PR or enabling auto-merge does not publish a release.

| Change | Label / increment |
|---|---|
| New feature or significant user-impacting fix | `release:minor`: `v0.4.2 → v0.5.0` |
| Small compatible fix, docs, tests, maintenance or behavior-preserving refactor | `release:patch`: `v0.4.2 → v0.4.3` |
| Intentional incompatible public contract change at 1.x+ | `release:major`: `v1.4.2 → v2.0.0` |

For 0.x, incompatible changes use minor with explicit migration/compatibility notes; do not move to 1.0 incidentally. Describe significant versus small fix impact in the PR. Mixed changes use the highest applicable increment. Dependency package versions do not dictate this application's release increment; assess their actual effect.

SemVer normally classifies compatible bug fixes as patch; significant fixes receiving minor is the owner's explicit project policy. Documentation/test-only patches are intentional checkpoints. Versions/tags describe the repository release; `Project.schemaVersion` remains independently governed by storage compatibility. Existing automation uses Git tags as the release version; it does not update package.json on each release.

The workflow publishes at the PR's exact merge SHA, generates GitHub release notes and uses a PR marker to avoid duplicate publication on reruns. Publication runs asynchronously; do not wait for it before ending the turn. Report release status only if already known. If a later task investigates a missing release, verify the workflow, published release and tag against the merge SHA, and repair/rerun a failed publication. Never move an existing published tag; corrections use another PR and release.

## Dependencies

`.github/dependabot.yml` checks npm and GitHub Actions weekly with limited open PRs. Related React, Vitest and Tailwind minor/patch updates are grouped; majors remain separate for focused compatibility review. Existing Docker/ZMK pins remain explicit maintenance work because their verified compatibility cannot be inferred from a newer tag.

Enable repository Dependabot alerts and security updates. Inspect security alerts promptly rather than waiting for the weekly version-update schedule. Dependabot PRs use the same verification, merge and release gates and default to `release:patch`; replace that label if actual product impact warrants minor/major. Do not blindly merge dependency majors or add new runtime packages without the required ADR.

## Basis and rationale

- [Git reference naming](https://git-scm.com/docs/git-check-ref-format): `/` is valid; `:` is forbidden in branch names.
- [GitHub flow](https://docs.github.com/en/get-started/using-github/github-flow): focused branches, reviewable PRs and a deployable default branch.
- [Protected branches](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches): required PR checks and restrictions, including administrator enforcement.
- [SemVer](https://semver.org/) and [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/): baseline version/commit conventions, with the explicit project release policy above.
- [Dependabot options](https://docs.github.com/en/code-security/reference/supply-chain-security/dependabot-options-reference): schedules, groups, labels and open-PR limits.
