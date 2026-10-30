## ZMK Customizer project context

Before this stage, read docs/workflow.md and follow AGENTS.md task-based routing.
Verify that the resolved feature matches the request. Use project template overrides,
preserve requirement identifiers and maintain one requirement → task → check → evidence
mapping. Do not regenerate completed stages without a relevant change.

Project rules take precedence over conflicting generic guidance below:
- Define behavior/matrix and test contracts before implementation. Follow docs/testing.md:
  static check after a complete module/import flow, full units at task completion,
  focused units only after a full-run failure, full E2E only at feature/final completion.
  No mandatory incomplete-code red run; pre-commit/check:changed are static-only.
- Supporting research/data-model/contracts/quickstart files are needed only for
  distinct useful content, as defined in docs/workflow.md.
- Select local checks and completion evidence using docs/commands.md and Git flow;
  do not impose a generic full local suite instead of the project's changed checks.
