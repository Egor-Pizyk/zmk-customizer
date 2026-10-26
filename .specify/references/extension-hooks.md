# Spec Kit extension hooks

Read this protocol only when .specify/extensions.yml exists. Apply the hook key
named by the calling skill at that point in its workflow.

1. Parse the YAML and select the named key under `hooks`. On invalid YAML,
   report the parser error and that no hooks (including mandatory hooks) were
   checked, then continue the stage. Missing keys have no hooks.
2. Skip entries with `enabled: false`; absent `enabled` means enabled. Do not
   evaluate conditions: skip a non-empty `condition`, leaving evaluation to
   HookExecutor. Missing, null or empty conditions are executable.
3. Convert dots in command names to hyphens for slash invocations
   (`speckit.git.commit` → `/speckit-git-commit`). Adapt invocation to the
   current client, such as `$speckit-…` or `/skill:speckit-…`.
4. For `optional: true`, show extension, command, description and prompt with
   an invitation to execute; do not execute automatically.
5. For `optional: false`, show extension and command, emit
   `EXECUTE_COMMAND: {command}`, actually invoke it and wait for its result
   before continuing. Printing the marker alone is insufficient.

Run before-hooks before stage work and after-hooks before the completion report.
If the configuration does not exist or no eligible hooks exist, skip silently.
