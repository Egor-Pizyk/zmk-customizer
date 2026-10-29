# Rules for agents

- Do not use Computer Use, CUA, ordinary browser profiles or native app control without an explicit user request. Isolated automated Playwright tests through the terminal are allowed under `docs/testing.md`.
- Inspect the working tree before edits. Preserve existing user changes; do not reset, overwrite or revert unrelated work.
- Stay inside the task. Record unrelated defects briefly in the existing journal; investigate when evidence connects them to the change or they block required checks. Use the smallest baseline comparison needed to distinguish an existing failure. No drive-by refactors, unrelated renames or speculative helpers. Dependency policy belongs to `docs/tooling.md`.
- For unclear ZMK facts, read the pinned reference and linked upstream source; report what remains unverified rather than guessing.
- Record actual checks and their limits. Never claim a manual accessibility check, firmware build or test was run when it was not.
- When features or user flows are added, changed or removed, update affected onboarding steps, learning objectives, targets, text and verification in the same change. If no onboarding update is needed, record the reason in the feature verification evidence.
- Comments explain non-obvious reasons and ZMK quirks; do not repeat code.
- Never commit `dist/`, `coverage/`, `node_modules/` or other generated reports.

Implementation conventions live in guidelines; test policy in `docs/testing.md`; SDD routes and completion gates in `docs/workflow.md`.

## Efficient context and verification

- Inspect the working tree first. Use `bash scripts/agent-status.sh` when feature/branch ownership or resumption needs its revision and Spec Kit details; prose-only work does not require feature resolution. Inspect open PRs when Git flow requires it.
- Search with `rg` / `rg --files` (`git grep` / `git ls-files` if unavailable), then load only the section needed for the next decision/edit. No startup document batch or union of all matching routing rows is required. Avoid broad multi-file dumps; reuse loaded rules under `AGENTS.md`.
- Use `npm run check:focus -- --plan` and `npm run check:focus` for targeted diagnostics
  after staging explicit paths; read `summary.json` before full logs. Focus receipts
  never replace the required final `check:changed`.
- Save full logs to files. Return outcomes/counts and log paths; inspect focused
  failure excerpts. Repeated successful output and unchanged log tails add no evidence.
- Wait for long processes in 20–30 second intervals; communicate meaningful progress
  at least once per minute. Avoid repeated short polls and unchanged log tails.
- Verification commands, snapshot selection and receipts: [commands](commands.md).
- Keep one concise journal per task: scope/decisions, base and checked SHA/tree,
  results/log links and remaining limits. Link it from other artifacts; omit command
  transcripts and repeated history. Maintenance uses the PR body. Evidence applies
  only to its revision; reporting-only edits follow the documentation route.
- On resumption, inspect current status/diff; resolve the feature when doing feature work or ownership is unclear.
  For a new chat or compaction, preserve only branch/feature, revision, accepted
  scope, pending work, material decisions and check receipts/limits. Reuse existing
  artifacts; do not create a separate context cache. Keep user updates about findings
  or decisions, and final answers about result, checks, limits and delivery link.
