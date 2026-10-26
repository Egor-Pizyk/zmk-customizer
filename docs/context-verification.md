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

## 2026-10-26 project documentation maintenance

Scope: project-owned documentation, guidelines and agent instructions. Open-source
skills, plugins and Spec Kit files are excluded and unchanged relative to the base.
This refines ADR 0018 without changing product requirements or completion gates.

- Removed repetitive control-flow/naming examples, retaining all normative rules
  and explicitly preserving the array-callback warning. Technical TypeScript,
  accessibility and styling examples remain where they explain specific contracts.
- Centralized module/API placement in folder-structure.md, verification selection
  in commands.md, delivery gates in Git flow and continuity in agent-rules.md.
  Testing keeps behavioral assertions, coverage floors, browser/manual acceptance,
  mutation safety and geometry details; duplicate command/placement prose is linked.
- Corrected testing.md's stale statement that ZMK suites run in CI to agree with
  the existing local-only firmware gate. No CI policy was changed.
- The 033 viewport exception has one owner in admin-ui.md and a Tailwind link.
- Bash scripts/agent-status.sh produces a read-only local resume snapshot using
  the unchanged Spec Kit no-persist resolver. Selection is explicitly not ownership.
- MJS scripts/audit-agent-context.mjs audits project-owned instruction size, local
  inline-link targets and exact repeated paragraphs; third-party files are excluded.
  Usage and parser limits: [commands](commands.md#agent-maintenance-helpers).

Against base ee99a9a, the same 27-file project instruction corpus decreased
from 20,365 to 19,547 whitespace-separated words (4.0%). Startup decreased from
2,507 to 2,413 words. Counts exclude this historical evidence page, skills/plugins,
Spec Kit, ADR history, feature artifacts except their ownership index, ZMK reference
notes, helper source and platform/provider overhead. These are source-size proxies,
not token measurements or demonstrated live-session savings.

Four helper tests cover link resolution/filtering, malformed encoding, startup and
duplicate accounting, and CLI execution outside the repository with third-party
files excluded. Static review does not prove independent-agent context quality.
The maintenance PR owns current-tree check receipts and limits. No product/UI,
onboarding, schema, generator or firmware behavior changed.
