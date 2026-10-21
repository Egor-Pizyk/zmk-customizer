# Git flow

Owner of branch, PR and delivery rules. Read at startup and again before delivery.
[Workflow](../workflow.md) owns SDD; [testing](../testing.md) owns verification.

## Start

- Inspect status, branches and open PRs. One active feature by default: unfinished
  work with unmerged changes or an open PR. Merged historical branches do not count.
- Finish the active feature before starting another. A second active branch requires
  a user request or acute necessity recorded in the task journal. Dependency-bot PRs
  are maintenance, not active product features.
- Every new feature starts from current `origin/main`. Use worktrees only when an
  actual isolation need exists; record why. Never create feature stacks.
- Preserve existing edits in separate thematic commits on their owning branch;
  inspect explicit staged paths. Never automatically stash, reset, absorb unrelated
  work, secrets or generated files.

```sh
git status --short
gh pr list
git fetch origin
git switch main
git pull --ff-only
git switch -c feature/NNN-short-name
# implement; stage explicit paths; pre-commit checks the index snapshot
git commit -m "feat: describe resulting behavior"
git push -u origin HEAD
gh pr create --base main --body-file /tmp/pr-description.md
# Report PR + local checks + limits, then stop. No auto-merge or CI polling.
```

Use Conventional Commits. Branch prefixes: `feature/`, `fix/`, `docs/`, `test/`,
`chore/`, `refactor/`; lowercase ASCII kebab-case. Keep the exact `NNN-short-name`
for specified features; maintenance uses a descriptive slug without inventing a
spec number. Spec directories stay unprefixed. Resolve Spec Kit selection and
compare it with the request; persisted selection alone does not establish ownership.

## Deliver

One feature = one branch and one PR to main, including spec, code, tests and evidence.
Use separate logical commits for local changes; do not split a feature into PR stacks.
Run [changed checks](../commands.md), inspect the final diff and record actual limits.
Required manual acceptance still applies: open a draft when it is outstanding.
The PR describes the problem, resulting behavior, validation and compatibility limits.

Set exactly one release label before merge:

| Label | Use |
|---|---|
| `release:patch` | small fix, docs, tests, tooling or behavior-preserving refactor |
| `release:minor` | feature, significant user-impacting fix, incompatible 0.x change |
| `release:major` | intentional incompatible public contract at 1.x+ |

**Finish after creating/updating the PR.** Do not submit merge or enable auto-merge
unless the user separately requests it. Do not wait for CI or release publication.
Never claim unobserved CI, manual acceptance, merge or release success.

## Merge and release

Main requires a PR, up-to-date checks, resolved conversations and linear history,
including for administrators. All CI suites must pass for the final revision:
`check` aggregates static checks, unit/coverage, `e2e`, `image`, `mutations` and
`zmk-build`. Failure, cancellation or unexpected skip blocks the gate. Preserve the
existing protected status names; never use `--admin` or weaken protection.

When separately authorized and acceptance is complete, squash merge through GitHub.
The existing release workflow publishes one release per merged PR at its merge SHA.
Tags own application versions; project schema versions are independent. Never move
published tags. Report pending, merged and published states distinctly.

Dependabot PRs follow the same gates and default to `release:patch`; assess majors
and dependency policy explicitly. Branch cleanup is a separate explicit action.
