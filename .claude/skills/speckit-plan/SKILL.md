---
name: "speckit-plan"
description: "Execute the implementation planning workflow using the plan template to generate design artifacts."
argument-hint: "Optional guidance for the planning phase"
compatibility: "Requires spec-kit project structure with .specify/ directory"
metadata:
  author: "github-spec-kit"
  source: "templates/commands/plan.md"
user-invocable: true
disable-model-invocation: false
---


## Project context

Before this stage, read docs/workflow.md and follow AGENTS.md task-based routing. Verify the resolved feature directory matches the requested task. Use project templates, preserve requirement identifiers, and load only relevant supporting artifacts. Project test requirements apply even if generic examples call tests optional. Keep plan.md Relevant context and a single requirement → task → check → evidence mapping current. Do not regenerate completed stages without a relevant change.

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Pre-Execution Checks

If `.specify/extensions.yml` exists, read [the shared hook protocol](../../../.specify/references/extension-hooks.md) and apply `hooks.before_plan` before stage work. Otherwise skip silently.

## Outline

1. **Setup**: Run `.specify/scripts/bash/setup-plan.sh --json` from repo root and parse JSON for FEATURE_SPEC, IMPL_PLAN, FEATURE_DIR, BRANCH. For single quotes in args like "I'm Groot", use escape syntax: e.g 'I'\''m Groot' (or double-quote if possible: "I'm Groot").

2. **Load context**: Read FEATURE_SPEC and `.specify/memory/constitution.md`. Load IMPL_PLAN template (already copied).

3. **Execute plan workflow**: Follow the structure in IMPL_PLAN template to:
   - Fill Technical Context (mark unknowns as "NEEDS CLARIFICATION")
   - Fill Constitution Check section from constitution
   - Evaluate gates (ERROR if violations unjustified)
   - Resolve material unknowns; create research.md only for distinct useful findings
   - Define design/contracts in plan.md; create separate data-model.md, contracts/ or quickstart.md only for distinct useful content (docs/workflow.md)
   - Re-evaluate Constitution Check post-design

## Mandatory Post-Execution Hooks

If `.specify/extensions.yml` exists, read [the shared hook protocol](../../../.specify/references/extension-hooks.md) and apply `hooks.after_plan` before reporting completion. Otherwise skip silently.

## Completion Report

Command ends after Phase 1 design. Report branch, IMPL_PLAN path, generated artifacts and why any optional artifacts were omitted.

## Phases

### Phase 0: Outline & Research

1. **Extract unknowns from Technical Context** above:
   - For each NEEDS CLARIFICATION → research task
   - For each dependency → best practices task
   - For each integration → patterns task

2. **Research unresolved questions**, reusing verified project sources. Delegate only when independent research is useful and authorized:

   ```text
   For each unknown in Technical Context:
     Task: "Research {unknown} for {feature context}"
   For each technology choice:
     Task: "Find best practices for {tech} in {domain}"
   ```

3. **Consolidate findings** in plan.md or, for distinct useful content, `research.md`, using format:
   - Decision: [what was chosen]
   - Rationale: [why chosen]
   - Alternatives considered: [what else evaluated]

**Output**: all material unknowns resolved, recorded in plan.md or a distinct research.md

### Phase 1: Design & Contracts

**Prerequisites:** material unknowns resolved

1. **Extract entities from feature spec** → plan.md or a distinct `data-model.md`:
   - Entity name, fields, relationships
   - Validation rules from requirements
   - State transitions if applicable

2. **Define interface contracts** → plan.md or distinct files in `contracts/`:
   - Identify what interfaces the project exposes to users or other systems
   - Document the contract format appropriate for the project type
   - Examples: public APIs for libraries, command schemas for CLI tools, endpoints for web services, grammars for parsers, UI contracts for applications
   - Skip if project is purely internal (build scripts, one-off tools, etc.)

3. **Document validation scenarios** in plan.md; create `quickstart.md` only when a separate runnable guide adds value:
   - Document runnable validation scenarios that prove the feature works end-to-end
   - Include prerequisites, setup commands, test/run commands, and expected outcomes
   - Use links or references to contracts and data model details instead of duplicating them
   - Do not include full implementation code, model/service/controller bodies, migrations, or complete test suites
   - Keep this artifact as a validation/run guide; implementation details belong in `tasks.md` and the implementation phase

**Output**: plan.md with design, contracts and validation; optional supporting files only as needed

## Key rules

- Use absolute paths for filesystem operations; use project-relative paths for references in documentation
- ERROR on gate failures or unresolved clarifications

## Done When

- [ ] Plan workflow executed and design artifacts generated
- [ ] Extension hooks dispatched or skipped according to the rules in Mandatory Post-Execution Hooks above
- [ ] Completion reported to user with branch, plan path, and generated artifacts
