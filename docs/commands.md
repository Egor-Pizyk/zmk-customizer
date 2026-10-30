# Commands

The application uses Node24 in Docker. `make` wraps container commands; direct npm
commands work in a prepared container or supported host with dependencies installed.

## Separate verification stages

| Command | Runs | When |
|---|---|---|
| `npm run check` / `make check` | Architecture, app/E2E types, lint, oxfmt format check | After a complete logical module: finish related files/imports/exports/callers first |
| `npm run test:unit` / `make test-unit` | All Vitest app/golden tests and Node tooling unit tests | After completing a task item in tasks.md |
| `npm run test:unit:changed` / `make test-unit-changed` | Units related to the exact staged changes; tooling units when affected | Optional changed-impact check at a task checkpoint, never implicit from static checks |
| `npm run test:unit:focus -- tests/unit/example.test.ts -t "case"` | Only the named file/module and optional test name | Diagnose/fix an actual failure from the full unit run |
| `npm run test:unit:focus -- tests/tooling/example.test.mjs` | Only the named Node tooling unit file | Same failure-diagnosis rule |
| `npm run test:e2e` / `make test-e2e` | Complete configured Playwright suite: Chromium plus configured Firefox/WebKit cases | Only at feature/final commit completion, after static and units are settled |

The formatter is the existing **oxfmt**; Prettier is not installed. `check:static`
is an alias of `check`. `test` remains the Vitest-only compatibility command;
`test:tooling` runs Node tooling units separately. `test:coverage` retains CI coverage
thresholds. `check:guidelines`, `check:mutation-runners`, `check:release` remain
available explicitly; tooling units and CI retain their existing protection.

Do not run checks after an edit that predictably leaves imports, exports, types or
callers unfinished. Complete the obvious implementation flow, then run static checks.
Full units belong to task completion. If they fail, fix the issue and rerun the failed
file/case with `test:unit:focus`; resume full validation at the next task/final boundary.
Do not use focused tests as routine per-edit checks or a replacement for full units.
Do not run browser suites mid-task or silently via another verification command.

## Staged snapshots and pre-commit

```sh
npm run hooks:install
git add -- path/to/completed-module
npm run check:changed -- --plan       # static staged selection; no test execution
npm run check:changed                 # static stage only, also pre-commit
npm run test:unit:changed -- --plan    # unit-only staged selection
npm run test:unit:changed             # unit-only staged execution
npm run check:changed -- --base origin/main # committed HEAD vs base, static only
```

Both snapshot commands require host Node24, Git, tar and Docker Compose. They export
the index (or committed HEAD with `--base`) into a temporary container directory;
unstaged edits remain untouched. Stage explicit task paths. Missing/deleted/global
unit inputs widen unit selection; missing related-test evidence falls back to full
app units. Neither stage selects E2E. Static checks retain whole type/architecture
graphs and changed-file lint/format. Full `check` lints/formats the full configured scope.

Logs/summary and successful receipts live under `.check-logs/static/` and
`.check-logs/unit/`, keyed by exact tree/base. Static and unit receipts cannot satisfy
each other or reuse historical combined receipts. `--force` explicitly reruns;
`--plan` displays selection without Docker. No stash/index rewrite occurs. Changed
manifests install dependencies in the snapshot when needed.

Pre-commit checks **only static** staged bytes and reuses an exact passing static
receipt. It never starts unit/E2E tests; run those explicitly at their task/feature
boundaries. A final feature commit requires full unit and full configured E2E evidence;
intermediate module commits do not implicitly trigger browsers. CI still owns full
coverage thresholds, tooling checks and the browser matrix for the final PR revision.
The legacy `check:focus` alias now forwards to `test:unit:focus` and requires a file;
it is no longer a combined/browser diagnostic runner. `test:unit:focus -- tests/unit/domain/wiring` also accepts an explicit app test module.
The old `--focus` snapshot
option and automatic production-to-Chromium expansion are retired.

## Development and explicit diagnostics

```
make up / down / logs / sh / install  # development server http://localhost:5173
npm run dev / build / preview
npm run lint:fix / format            # explicit repairs; check never rewrites files
make image / prod                   # production image, http://localhost:8080
make zmk-build                      # local pinned firmware verification
make test-mutations / test-e2e-mutations # deliberate sensitivity experiments
```

`make test-unit-focus ARGS='tests/unit/example.test.ts -t case'` runs the focused
command in Docker. Build browser image/dependencies when needed; `make help` lists
wrappers. Mutation runners still execute alone because they temporarily edit source;
quality experiments are explicit, not a mandatory per-edit red/green loop. The browser
runner uses isolated profiles and a production build. Do not claim OS/screen-reader
or firmware acceptance from static/unit/browser results alone.

Container definitions and pinned ZMK runner live in `infra/`; Compose project name
is `zmk-customizer`. Never run destructive cleanup to prepare checks. Record actual
failures, commands, revision and limits in the owning verification journal.

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
