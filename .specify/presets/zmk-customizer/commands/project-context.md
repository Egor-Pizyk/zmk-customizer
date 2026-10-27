## ZMK Customizer project context

Before this stage, read docs/workflow.md and follow AGENTS.md task-based routing.
Verify that the resolved feature matches the request. Use project template overrides,
preserve requirement identifiers and maintain one requirement → task → check → evidence
mapping. Do not regenerate completed stages without a relevant change.

Project rules take precedence over conflicting generic guidance below:
- Tests-first and browser coverage follow docs/workflow.md and docs/testing.md;
  required tests are not optional even when the prompt does not request them.
- Supporting research/data-model/contracts/quickstart files are needed only for
  distinct useful content, as defined in docs/workflow.md.
- Select local checks and completion evidence using docs/commands.md and Git flow;
  do not impose a generic full local suite instead of the project's changed checks.
