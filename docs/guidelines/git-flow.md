# Git flow

Inspect status/diff and preserve existing edits. Use the current branch for the requested work unless isolation is needed; no feature resolver, artifact directory, reserved number or one-active-feature gate. Do not stash/reset unrelated work.

## Commit and PR

- Use Conventional Commits and separate coherent changes. Stage explicit paths; exclude secrets, generated assets and reports. A commit does not require a full local browser run.
- Branch names use a descriptive `feature/`, `fix/`, `docs/`, `test/`, `chore/` or `refactor/` slug when creating a branch. New branches start from current main; do not create stacks unless requested.
- Commit/push/create or update a PR when requested. Describe the resulting behavior, relevant checks and material limits; no matrix, task journal or command transcript.
- Local verification is proportional under [testing policy](../testing.md). CI owns the complete final-revision checks; optional pre-commit verifies static staged bytes only.
- Stop after requested delivery. No CI/release polling or auto-merge unless requested. Do not claim unobserved acceptance, merge or publication.

## Merge and release

Main requires a PR, passing protected checks, resolved conversations and linear history. Do not bypass protection or use `--admin`. Protected statuses remain `check`, `e2e`, `image` and `mutations`; check aggregates existing static, units/coverage, browser, image and mutation jobs. This workflow change does not weaken CI.

Merge requires a separate user request. Set exactly one release label: `release:patch` for fixes/docs/tooling/refactors; `release:minor` for features/significant 0.x changes; `release:major` for intentional incompatible 1.x+ contracts. The release workflow publishes at the merge SHA. Tags own app versions; schema versions are separate. Never move published tags. Branch cleanup is a separate action. Details: [releases](../releases.md).
