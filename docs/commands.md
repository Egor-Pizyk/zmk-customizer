# Commands

Node-related tasks are npm scripts. Everything else is `make`. Both run inside Docker by default so host Node version does not matter.

```
make up          # start dev server in Docker (http://localhost:5173)
make down        # stop containers
make logs        # follow dev server logs
make sh          # shell inside the app container
make install     # npm ci inside the container (run after dependency changes: node_modules is a Docker volume)
make check       # typecheck + lint + format check + Vitest coverage inside the container
make test-e2e    # production build + Chromium suite + focused Firefox/WebKit checks
make test-e2e-mutations # controlled browser regressions; run alone after make test-e2e
make zmk-build   # local-only pinned firmware verification; not run in CI
make image       # build production image (nginx serving dist/)
make prod        # run production image locally (http://localhost:8080)
make clean       # remove dist/, coverage, containers, volumes

npm run dev | build | preview
npm run typecheck | lint | lint:fix | format | format:check
npm run test | test:watch
npm run test:e2e | test:e2e:types
npm run check    # static checks + Vitest coverage; browser execution is a separate CI job
```

`make help` lists targets. Normal local verification:

```sh
npm run hooks:install                 # once per clone; also installed by make install
git add -- path/to/changed-file       # stage explicit paths
npm run check:focus -- --plan         # diagnostic selection as JSON; no Docker run
npm run check:focus                   # targeted diagnostic run
npm run check:changed                 # completed task/large-change checkpoint; also pre-commit
npm run check:changed -- --base origin/main # committed branch vs base
```

Run `check:changed` at the logical end of a task item or a substantial completed
change, not after each file edit/save. Use affected tests or `check:focus` inside the
task; finish related fixes before rerunning a failed checkpoint. Batch intermediate
edits into the next checkpoint even when they invalidate an earlier receipt. See
[changed-check cadence](testing.md#changed-check-cadence). Commit completed units;
the pre-commit hook verifies that snapshot and reuses an exact successful receipt.

The host needs Node 24, Git, tar and Docker Compose. The runner exports the Git tree
into an ignored temporary directory, mounts it into the browser-capable test container
and removes it after checks. Full logs and successful tree/base receipts remain in
`.check-logs/`; identical checks are reused by pre-commit. Add `-- --force` to rerun. Run `make install` and build `infra/compose.e2e.yaml` once
when needed; Docker must be available. No automatic stash or index rewrite occurs.
Changed dependency manifests require `npm ci` in the snapshot before checks. Failures
block commits. Existing custom hooks must be reviewed before installing this hook.

Selection: changed files for lint/format, related Vitest tests, whole-project typecheck
and architectural invariants, all tooling tests for tooling changes. Deletions and
global inputs expand unit selection; production changes expand browser selection to
all Chromium journeys. Full CI runs every suite, with browsers in a parallel matrix.
Use direct/full commands only for diagnosis or justified necessity, recording why.
Manual acceptance is separate; scripts do not establish screen-reader/OS acceptance.

Build command inside Docker: `docker compose -p zmk-customizer -f infra/compose.yaml run --rm app npm run build`. Do not run destructive cleanup to prepare checks. Record failures and unavailable checks accurately.

Container definitions and the pinned ZMK runner live in `infra/`; Makefile selects them with explicit paths and the stable `zmk-customizer` Compose project name. Build contexts and app mounts remain at the repository root. Docker ignore rules are Dockerfile-specific files beside the Dockerfiles, so no root `.dockerignore` is needed.

Mutation orchestration uses host Node 24: Makefile delegates to npm run test:mutations / npm run test:e2e:mutations, which launch the test containers through Docker. The application checks and builds continue to run inside Docker.

Focused checks are diagnostic: supported Parts/layout/encoder, project creation/import
and onboarding changes select related Chromium journeys plus keyboard, accessibility
and lifecycle guards. Unknown runtime areas, shared/global inputs and deletions fall
back to all Chromium journeys. Changed browser specs are always included. Unit and
static selection follow the normal runner. The mapping lives in
`scripts/focused-check-plan.mjs`; extend it with affected user journeys when adding areas.

`check:focus` accepts the same `--base REV` and `--force` options. `--plan` also works
with `check:changed`; file existence comes from the selected Git tree. Planning uses
the invoked runner version, while execution recomputes selection inside the snapshot.
Focus receipts/logs live under `.check-logs/focus/`, separate from final receipts.
Each execution writes `summary.json` with selection reasons, status, per-step timing,
full-log paths and bounded failure excerpts. Read it first, then the relevant full log.
A successful focus run never replaces `check:changed` or its pre-commit gate.

## Agent maintenance helpers

- `bash scripts/agent-status.sh`: read-only local branch/revision, staged/unstaged summaries and Spec Kit selection. Does not fetch, change branches or persist feature selection; ownership still requires comparing the request.
- `node scripts/audit-agent-context.mjs`: startup/routed instruction word counts, largest files, exact repeated prose and missing local inline Markdown targets. `--json` includes every file and repeat group. Resolves paths from the script, so it works outside the repository cwd. No writes, network or dependencies. Counts are source-size proxies, not model tokens; link checks exclude anchors, reference-style links and code examples.

Use the audit after changing instructions, shared references or routing. Preserve existing Spec Kit resolvers rather than duplicating feature-selection logic. Skills, plugins and Spec Kit files are outside this project-documentation audit.

## Spec Kit maintenance

The CLI and managed project files are pinned to Spec Kit **1.2.3**. Install the CLI
with uv-managed Python 3.12 (the application runtime/dependencies are unaffected):

```sh
uv tool install --force --python 3.12 --from git+https://github.com/github/spec-kit.git@v1.2.3 specify-cli
specify version --json
specify integration status
```

Project-owned sources are separate from upstream files:

- `.specify/templates/overrides/{spec,plan,tasks}-template.md` preserve project
  artifact formats. Base files in `.specify/templates/` remain upstream-managed.
- `.specify/presets/zmk-customizer/` owns the common context/test-policy prepend
  for plan/tasks/implement; `.specify/presets/.registry` enables it in fresh clones.
  Edit this local preset, then run `specify integration upgrade claude` to regenerate
  delivered skills. Do not hand-edit generated `.claude/skills/speckit-*` files.
  The ignored `.composed/` files are disposable CLI caches.
- Existing `.agents/skills` symlinks expose the same generated skills to Codex.
  Claude is the registered integration; preserve these adapters when upgrading.

Routine integration refresh uses `specify integration upgrade claude`; confirm
`specify integration status` reports no modified/missing managed files. The CLI can
warn that existing shared infrastructure was skipped even when it already matches
the pinned release. For a version change, review upstream differences and protect
project-owned sources before using `--force` to refresh shared scripts/templates.
Do not use `preset update` against this local preset without a separate source copy:
that operation removes the installed directory before reinstalling.

Native Spec Kit events are disabled in stored integration options to preserve the
existing formatter hook. Automatic skill invocation remains enabled. Enabling
new events or explicit-only invocation is a separate workflow choice. Preserve
`specs/`, constitution, feature selection and unrelated agent settings on upgrades.
