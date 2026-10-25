# Rules for agents

- Do not use Computer Use, CUA, ordinary browser profiles or native app control without an explicit user request. Isolated automated Playwright tests through the terminal are allowed under `docs/testing.md`.
- Inspect the working tree before edits. Preserve existing user changes; do not reset, overwrite or revert unrelated work.
- Stay inside the task. Record unrelated defects briefly in the existing journal; investigate when evidence connects them to the change or they block required checks. Use the smallest baseline comparison needed to distinguish an existing failure. No drive-by refactors, unrelated renames or speculative helpers. Dependency policy belongs to `docs/tooling.md`.
- Follow the mandatory context routing in `AGENTS.md`; load relevant rules before editing, not only after a check fails.
- For unclear ZMK facts, read the pinned reference and linked upstream source; report what remains unverified rather than guessing.
- Record actual checks and their limits. Never claim a manual accessibility check, firmware build or test was run when it was not.
- When features or user flows are added, changed or removed, update affected onboarding steps, learning objectives, targets, text and verification in the same change. If no onboarding update is needed, record the reason in the feature verification evidence.
- Comments explain non-obvious reasons and ZMK quirks; do not repeat code.
- Never commit `dist/`, `coverage/`, `node_modules/` or other generated reports.
- Review [Git flow](guidelines/git-flow.md) at startup and delivery under the context-reuse rule in `AGENTS.md`. Live working-tree/PR state and verification evidence must still be inspected for the current task.

Implementation conventions live in guidelines; test policy in `docs/testing.md`; SDD routes and completion gates in `docs/workflow.md`.

## Efficient context and verification

- Search with `rg` / `rg --files`, then read the required complete section. Avoid
  broad multi-file dumps and truncated output; reuse loaded rules under `AGENTS.md`.
- Save full logs to files. Return outcomes/counts and log paths; inspect focused
  failure excerpts. Repeated successful output and unchanged log tails add no evidence.
- Wait for long processes in 20–30 second intervals; communicate meaningful progress
  at least once per minute. Avoid repeated short polls and unchanged log tails.
- Use `npm run check:changed` for local verification (staged snapshot); use `-- --base
  origin/main` for the committed branch. Direct test runs are for diagnosis or acute
  need, with a reason recorded. Full CI owns comprehensive checks.
- Keep one concise journal per task: scope/decisions, base and checked SHA/tree,
  results/log links and remaining limits. Link it from other artifacts; omit command
  transcripts and repeated history. Maintenance uses the PR body. Evidence applies
  only to its revision; reporting-only edits follow the documentation route.
- For a new chat or compaction, preserve only branch/feature, revision, accepted
  scope, pending work, material decisions and check receipts/limits. Reuse existing
  artifacts; do not create a separate context cache. Keep user updates about findings
  or decisions, and final answers about result, checks, limits and delivery link.
