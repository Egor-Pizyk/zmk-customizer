# Git flow

This document owns Git delivery policy. Read it **before starting/resuming work or creating a feature/branch**, and **again after verification, before committing or delivering the result**. [Workflow](../workflow.md) owns SDD; [commands](../commands.md) and [testing](../testing.md) own verification.

## Before work

1. Inspect `git status --short`, the current branch, remotes and existing PRs. Preserve unrelated changes; use an isolated worktree if they would mix with this task. Never use blanket staging, resets or automatic stashing to absorb somebody else's work.
2. Choose the change route in workflow.md. Resolve Spec Kit context with `bash .specify/scripts/bash/check-prerequisites.sh --paths-only --json` and compare it to the request. Persisted selection is not ownership evidence: repository maintenance need not belong to the last selected product feature.
3. Fetch origin. Start independent work from current `origin/main`; start a dependent slice from its parent branch. Plan focused PRs and their dependency order before editing.

## Branches and commits

Use lowercase ASCII kebab-case and `/` after the type. Git forbids `:` in branch names; colons belong in commit/PR titles. Use `feature` (not `frature`).

| Work | Branch example | Commit / squash title |
|---|---|---|
| Product capability | `feature/032-project-creation` | `feat: simplify project creation` |
| Bug fix | `fix/032-project-creation-cancel` | `fix: preserve project on cancel` |
| Documentation / specifications | `docs/032-project-creation` | `docs: specify project creation` |
| Independent tests | `test/032-project-creation-coverage` | `test: cover project cancellation` |
| Maintenance / dependency update | `chore/update-playwright` | `chore: update Playwright` |
| Behavior-preserving refactor | `refactor/wiring-queries` | `refactor: simplify wiring queries` |

For feature-related work, retain the exact `NNN-short-name` spec identifier, adding a short slice suffix when needed. Work outside a feature uses a descriptive spec-like slug without inventing a spec number. Existing historical branches/directories need no rename. Dependabot-generated branch names are an exception.

Spec identifiers and Git branches are separate: keep `specs/NNN-short-name/` unprefixed. The installed Spec Kit creator creates the directory and selection state, not a Git branch. After resolving the identifier, create the appropriate typed branch. Do not put `feature/` into `SPECIFY_FEATURE_DIRECTORY`; use the exact spec directory. A feature can span several PRs without duplicating its spec.

Use Conventional Commits, one logical change per commit. Stage explicit files/hunks, inspect `git diff --cached`, and exclude unrelated work, secrets and generated output. Use `!` plus a `BREAKING CHANGE:` explanation for intentional incompatible changes.

## Focused PRs and stacks

Use GitHub flow: short-lived branches and PRs into protected `main`, with dependent PRs forming a stack. No permanent develop/release branches or additional stack service is required.

Prefer separate documentation, implementation and independent coverage PRs when each resulting main revision is coherent, green and releasable. Specs may land first and mark behavior as planned. Required regression/domain/generator/E2E tests and migration compatibility tests belong with the implementation they protect. Tests-first still means observing the required failure locally before fixing it; do not merge a red test-only intermediate revision. Do not separate tests merely to meet a file-type split.

Example: `main ← docs/032-project-creation ← feature/032-project-creation ← test/032-project-creation-coverage`. Open the first PR against main and each child against its immediate parent. List parent/child PR links, scope and merge order in each description. Separate independent work can target main directly.

Merge from the bottom of the stack upward:

1. Verify the parent PR, then squash-merge it into main and confirm its release before merging another PR.
2. Fetch origin and retain the old parent tip. For a child with exclusive commits on top of that tip, use `git rebase --onto origin/main <old-parent-tip> <child-branch>` to replay only the child's changes. Do not naively replay the already-squashed parent commits. Resolve conflicts while preserving both intended changes.
3. Push a rewritten owned branch with `--force-with-lease` only; coordinate before rewriting a shared branch. Retarget the child PR to main and inspect its complete diff and commit list for missing or duplicated changes. Do not delete a parent branch until its children have been safely retargeted; GitHub may adjust bases when a branch is deleted, so verify the actual base.
4. Run the affected local checks again and wait for fresh required PR checks against main at the final head SHA. Prior green checks against the parent branch are insufficient. Repeat for each child.

## Finish, commit and merge

Re-read this guide after implementation/verification. Delivery of authorized repository work includes scoped commits, push, PR creation, merge and release verification, unless the user explicitly requests local-only work, a draft/review stop or another boundary. Do not ask again for routine delivery permission.

Before merging:

- Inspect the final diff; satisfy the applicable SDD, UI review and verification gates. Record actual evidence and limits in the owning artifacts or PR for maintenance. A green CI result does not replace acceptance criteria or required manual checks.
- Give the PR a Conventional Commit title and a description of the problem, resulting behavior, relevant spec/tasks, checks and material limits. Include stack links and explain the release increment.
- Set **exactly one** label: `release:patch`, `release:minor` or `release:major`, including for docs/test/chore PRs. Labels must be present before merge; branch type alone does not select a release.
- Require a main-based, non-draft PR with no unresolved blocking findings/conflicts and successful `check`, `e2e`, `image`, `mutations` and `zmk-build` checks for the final revision. Check runs in progress, cancelled, stale or failing block delivery. Never bypass protection with `--admin` or weaken checks to merge.
- Squash-merge autonomously once all gates pass. `gh pr merge <number> --squash --match-head-commit <verified-head-sha>` guards against a concurrent head change. Auto-merge is available for eligible main-based PRs after local acceptance/release-label review; do not enable it for children still targeting stack branches.

Main requires PRs, up-to-date status checks, resolved conversations and linear history; protection includes administrators, with force pushes and branch deletion disabled. No mandatory approving reviewer is configured for this solo workflow: agents review their diff and acceptance evidence before merging. Branch cleanup is explicit after dependents have moved.

If a check fails, fix it within scope and rerun affected checks. If access or infrastructure blocks delivery, report the precise blocker and leave an accurate PR/task state. Do not claim completion while required acceptance checks are missing.

## One release per merged PR

Use the existing `.github/workflows/release.yml` and `scripts/create-release.mjs`. Each PR releases when it reaches **main**, including every stack slice; merely opening a PR or merging into another feature branch does not publish a release.

| Change | Label / increment |
|---|---|
| New feature or significant user-impacting fix | `release:minor`: `v0.4.2 → v0.5.0` |
| Small compatible fix, docs, tests, maintenance or behavior-preserving refactor | `release:patch`: `v0.4.2 → v0.4.3` |
| Intentional incompatible public contract change at 1.x+ | `release:major`: `v1.4.2 → v2.0.0` |

For 0.x, incompatible changes use minor with explicit migration/compatibility notes; do not move to 1.0 incidentally. Describe significant versus small fix impact in the PR. Mixed changes use the highest applicable increment. Dependency package versions do not dictate this application's release increment; assess their actual effect.

SemVer normally classifies compatible bug fixes as patch; significant fixes receiving minor is the owner's explicit project policy. Documentation/test-only patches are intentional checkpoints. Versions/tags describe the repository release; `Project.schemaVersion` remains independently governed by storage compatibility. Existing automation uses Git tags as the release version; it does not update package.json on each release.

The workflow publishes at the PR's exact merge SHA, generates GitHub release notes and uses a PR marker to avoid duplicate publication on reruns. Verify the Release workflow succeeded, the published release exists and its tag resolves to that merge SHA before declaring delivery complete or merging the next PR. This sequencing also avoids overlapping releases; workflow concurrency alone is not a durable queue for arbitrarily many merges. If publication fails, repair/rerun it before continuing. For a previously merged PR missing its label, apply the single intended label and verify publication. Never move an existing published tag; corrections use another PR and release.

## Dependencies

`.github/dependabot.yml` checks npm and GitHub Actions weekly with limited open PRs. Related React, Vitest and Tailwind minor/patch updates are grouped; majors remain separate for focused compatibility review. Existing Docker/ZMK pins remain explicit maintenance work because their verified compatibility cannot be inferred from a newer tag.

Enable repository Dependabot alerts and security updates. Inspect security alerts promptly rather than waiting for the weekly version-update schedule. Dependabot PRs use the same verification, merge and release gates and default to `release:patch`; replace that label if actual product impact warrants minor/major. Do not blindly merge dependency majors or add new runtime packages without the required ADR.

## Basis and rationale

- [Git reference naming](https://git-scm.com/docs/git-check-ref-format): `/` is valid; `:` is forbidden in branch names.
- [GitHub flow](https://docs.github.com/en/get-started/using-github/github-flow): focused branches, reviewable PRs and a deployable default branch.
- [Changing a PR base](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/changing-the-base-branch-of-a-pull-request): base changes can alter commits/diffs and invalidate review context.
- [Protected branches](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches): required PR checks and restrictions, including administrator enforcement.
- [SemVer](https://semver.org/) and [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/): baseline version/commit conventions, with the explicit project release policy above.
- [Dependabot options](https://docs.github.com/en/code-security/reference/supply-chain-security/dependabot-options-reference): schedules, groups, labels and open-PR limits.
