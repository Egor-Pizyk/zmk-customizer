# Rules for agents

- Do not use Computer Use, CUA, ordinary browser profiles or native app control without an explicit user request. Isolated automated Playwright tests through the terminal are allowed under `docs/testing.md`.
- Inspect the working tree before edits. Preserve existing user changes; do not reset, overwrite or revert unrelated work.
- Stay inside the task. No drive-by refactors, unrelated renames or speculative helpers. Dependency policy belongs to `docs/tooling.md`.
- Follow the mandatory context routing in `AGENTS.md`; load relevant rules before editing, not only after a check fails.
- For unclear ZMK facts, read the pinned reference and linked upstream source; report what remains unverified rather than guessing.
- Record actual checks and their limits. Never claim a manual accessibility check, firmware build or test was run when it was not.
- Comments explain non-obvious reasons and ZMK quirks; do not repeat code.
- Never commit `dist/`, `coverage/`, `node_modules/` or other generated reports.
- Read [Git flow](guidelines/git-flow.md) before starting/resuming work or creating a feature/branch, and re-read it after verification before committing, pushing or opening/merging PRs. It owns branch/commit naming, one PR per feature, release labels and immediate merge/auto-merge submission without CI polling.

Implementation conventions live in guidelines; test policy in `docs/testing.md`; SDD routes and completion gates in `docs/workflow.md`.
