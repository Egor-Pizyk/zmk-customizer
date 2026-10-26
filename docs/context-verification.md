# Agent context verification

Reviewed 2026-10-15 for [ADR 0018](decisions/0018-task-scoped-agent-context.md). This records documentation checks, not product verification.

## Startup budget

Direct startup imports plus AGENTS.md contain approximately 1,933 whitespace-separated words, down from approximately 18,671 before this change. This is not a token measurement and excludes platform instructions, skill descriptions, client-specific automatic rules and task context. Aim for 1,500–2,500 words; preserve critical constraints rather than optimizing the count alone.

## Routing walkthroughs

These are static reviews of instructions, not trials of independent agent sessions.

| Example task | Additional required context | Expected route and evidence |
|---|---|---|
| Fix key deletion violating an existing requirement | Relevant spec/contracts/tasks; architecture, folder ownership, domain model, TypeScript/control flow/naming, testing and commands | Existing-requirement bug; failing regression before repair; preserved identity/layers/undo; applicable code checks |
| Add a UI gesture | Relevant feature artifacts, architecture/tooling, UI and code-quality guidelines, accessibility, testing and commands | Full SDD or existing-feature extension; keyboard alternative, one gesture/undo step, real-browser assertions and affected reruns after changes/failures |
| Change generated shield syntax | Architecture/domain/tooling, relevant feature artifacts, ZMK index and construct pages, fixtures, testing and commands | Independent golden contract before implementation; pinned-version source, deterministic output and ZMK build evidence |
| Improve prose documentation | Startup context and affected documents; decision index/ADR if changing policy | Direct documentation route; links/content/consistency checks, no product suite required |

Cross-area tasks take the union of matching rows. ADR history and unrelated feature artifacts are not required by these routes.

## Checks performed

- `git diff --check`: passed.
- `npm run check:guidelines`: passed (7 tooling tests and the current effect registry/rule/link gate).
- Local Markdown target check across changed project documentation: 72 links, no missing targets before this verification page was added; final links checked again after addition.
- Spec Kit `resolve-template.sh <spec|plan|tasks>-template --json`: selects the updated project templates.
- YAML parsing, skill names/descriptions and single project-routing section: passed for plan, tasks and implement. `.agents/skills` resolves to the same skill files as `.claude/skills`.
- The skill-creator `quick_validate.py` rejects pre-existing Claude metadata fields (`argument-hint`, `compatibility`, `disable-model-invocation`, `user-invocable`). Those provider fields were preserved; this validator did not pass.

## Limits and future evaluation

No product code was changed for this documentation task. Product/browser/firmware suites were not run. Existing unrelated working-tree changes were preserved. Historical ADR bodies retain old section references as decision history; active agent instructions use current document paths.

Observe the four routes in subsequent real tasks: does the agent find the owning requirement, read applicable rules before editing, preserve contracts and record actual evidence? Record missed routing or unnecessary reads here before adding more mandatory startup material. Client-specific import/rule deduplication and actual context token savings have not been measured.

## 2026-10-23 efficiency refinement

The 036 working session exposed repeated startup/Git-flow reads, oversized truncated
file dumps, repeated journal history and investigation of unrelated baseline failures.
The owning instructions now permit reuse of unchanged available rules across follow-ups,
recover only missing applicable context after compaction, require focused log excerpts,
bound unrelated diagnosis and sequence targeted checks before broad staged checks.
The UI workflow wording is shortened while retaining pre-code specification, rendered
review, accessibility, failure handling and evidence gates. This refines ADR 0018/0021;
mandatory matching routes, tests-first, final-index checks and CI/manual gates remain.
New-chat handoffs reuse feature artifacts instead of adding a parallel context store.

This is a documentation review, not a measured token-saving benchmark. Current-task
checks and revision are recorded in the existing PR body; no product behavior changed.
The five startup documents decreased from 2,577 to 2,468 whitespace-delimited words;
this measures document size, not tokens or savings from avoided rereads.

## 2026-10-26 instruction maintenance

Reviewed startup routing, all implementation guidelines, agent adapters, Spec Kit
hook sections and the planning stage. This maintenance follows ADR 0018; it does
not change product requirements, tests-first, pinned ZMK rules or delivery gates.

- Replaced 20 hook-protocol copies across 10 skills with stage-specific calls to
  `.specify/references/extension-hooks.md`, loaded only when extensions.yml exists.
  Preserved hook keys, disabled/conditional filtering, YAML-error disclosure,
  optional prompts and actual mandatory invocation/wait. Repository-relative
  traversal works through both `.claude/skills` and `.agents/skills` adapters.
- Aligned optional planning artifacts with workflow.md; research is driven by
  unresolved questions rather than automatically dispatching research agents.
- Removed repetitive examples from control-flow and naming guidelines, retaining
  all normative rules (including explicit array callbacks). Kept technical examples
  in TypeScript, accessibility and styling where they clarify specific contracts.
  The 033 viewport exception now has one owner with a link from Tailwind guidance.
- Added Bash `scripts/agent-status.sh` for a read-only resume snapshot, reusing
  Spec Kit's no-persist resolver. Its selected feature is explicitly not ownership.
- Added MJS `scripts/audit-agent-context.mjs` for reproducible source-size, local
  inline-link and exact paragraph-duplication audits. Usage/limits: [commands](commands.md#agent-maintenance-helpers).

Compared with base `ee99a9a`, the audited instruction corpus decreased from 34,710
to 28,759 whitespace-separated words (17.1%), including the new shared protocol.
The ten skill bodies decreased from 19,406 to 13,734 words (29.2%). Startup decreased
from 2,507 to 2,463 words (1.8%). These counts exclude this historical evidence page,
commands.md, helper source, platform instructions and provider overhead. They measure
source size, not model tokens or observed session savings. A stage without extensions
avoids loading the shared protocol; actual savings depend on task routing and reuse.

Three audit-script tests cover relative/encoded links, skipped external/anchor/code
links, malformed encoding, startup accounting and cross-file duplication. Static
review does not prove independent-agent behavior or measure context quality in use.
The maintenance PR owns current-tree check receipts and remaining limits; historical
results elsewhere on this page are not evidence for this revision. No UI, onboarding,
project schema, generators or firmware behavior changed.
