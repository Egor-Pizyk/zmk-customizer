# Rules for agents

- Do not use Computer Use, CUA, ordinary browser profiles or native app control without an explicit user request. Isolated automated Playwright tests through the terminal are allowed under `docs/testing.md`.
- Inspect the working tree before edits. Preserve existing user changes; do not reset, overwrite or revert unrelated work.
- Stay inside the task. No drive-by refactors, unrelated renames or speculative helpers. Dependency policy belongs to `docs/tooling.md`.
- Follow the mandatory context routing in `AGENTS.md`; load relevant rules before editing, not only after a check fails.
- For unclear ZMK facts, read the pinned reference and linked upstream source; report what remains unverified rather than guessing.
- Record actual checks and their limits. Never claim a manual accessibility check, firmware build or test was run when it was not.
- Comments explain non-obvious reasons and ZMK quirks; do not repeat code.
- Never commit `dist/`, `coverage/`, `node_modules/` or other generated reports.
- Read [Git flow](guidelines/git-flow.md) before starting/resuming work or creating a feature/branch, and re-read it after verification before committing, pushing or opening/merging PRs. It owns branch/commit naming, one PR per feature, release labels and stopping after PR creation without auto-merge or CI polling.

Implementation conventions live in guidelines; test policy in `docs/testing.md`; SDD routes and completion gates in `docs/workflow.md`.

## Efficient context and verification

- Search with `rg` / `rg --files`, then read the relevant complete normative section.
  Read mandatory startup documents fully; reuse other unchanged context already read.
- Return compact command summaries. Save full logs and inspect details on failures.
- Wait for long processes in 20–30 second intervals; communicate meaningful progress
  at least once per minute. Avoid repeated short polls and unchanged log tails.
- Use `npm run check:changed` for local verification (staged snapshot); use `-- --base
  origin/main` for the committed branch. Direct test runs are for diagnosis or acute
  need, with a reason recorded. Full CI owns comprehensive checks.
- Keep one change/verification journal per task: base SHA, checked SHA or tree digest,
  meaningful decisions, commands/results and log links. Link it from other artifacts;
  do not duplicate transcripts. For maintenance use the PR body, updating the existing
  description. A result applies only to its recorded revision.
