# Releases

Merge a PR into `main` with exactly one label:

| Label | Example |
|---|---|
| `release:patch` | `v1.2.3` → `v1.2.4` |
| `release:minor` | `v1.2.3` → `v1.3.0` |
| `release:major` | `v1.2.3` → `v2.0.0` |

The first patch release is `v0.0.1`. Versioning uses the highest stable
`vMAJOR.MINOR.PATCH` (or unprefixed) Git tag, ignoring prerelease and unrelated tags.
The Release workflow tags the PR merge commit and publishes a GitHub Release with
automatically generated changelog. Package metadata and project schema versions
are independent and are not changed by releases. No application behavior changes.

Create the PR and stop, following [Git flow](guidelines/git-flow.md); merge requires a separate user request. Do not wait or poll CI. GitHub enforces required checks before the actual merge. A label on an open PR does not publish.
A label added after merge also triggers publication, useful for the initial setup
PR. Multiple release labels fail explicitly; remove extras and rerun the failed
workflow. Reruns detect the PR marker in existing release notes to prevent a
second version. Keep this marker when editing release notes.

Publication is serialized with workflow concurrency. GitHub keeps one running and
one pending run per group; during a burst of merges it can replace pending runs.
Rerun any cancelled release run after the queue clears. Releases use the merge
commit even if `main` has advanced. They do not wait for post-merge CI; maintainers
rely on protected-branch checks for actual merge eligibility. Agents do not wait for publication and must distinguish an open PR, a merge and a published release. No release binaries are attached;
GitHub supplies source archives.

The workflow requires only the built-in `GITHUB_TOKEN` (`contents: write`), Node
from `.nvmrc`, and the runner's GitHub CLI. No external token or dependency is needed.
Release API reference: https://docs.github.com/en/rest/releases/releases

## Maintenance scope and verification

This is focused maintenance of the existing GitHub CI, not a product feature;
Spec Kit's stored selection `013-matrix-wiring-editor` does not own this work.
Preserved contracts: application code, serialized projects, undo/redo and ZMK output.
Checks: `make check`, release-tool tests, workflow formatting, PR CI, then a real
`release:patch` merge and inspection of the published version, tag and changelog.
Browser coverage is unchanged because the release workflow has no user journey.

CI's Docker-based mutation and ZMK jobs set `APP_USER=root` to write runner-owned
bind mounts (the runner UID differs from the image's `node` UID). Local Compose
continues to default to `node`; production image behavior is unchanged. This
addresses observed EACCES creating `.zmk-build` and missing mutation JSON reports.
