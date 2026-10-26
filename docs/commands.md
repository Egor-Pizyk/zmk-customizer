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
npm run check:changed                 # exact staged snapshot, also pre-commit
npm run check:changed -- --base origin/main # committed branch vs base
```

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

## Agent maintenance helpers

- `bash scripts/agent-status.sh`: read-only local branch/revision, staged/unstaged summaries and Spec Kit selection. Does not fetch, change branches or persist feature selection; ownership still requires comparing the request.
- `node scripts/audit-agent-context.mjs`: startup/routed instruction word counts, largest files, exact repeated prose and missing local inline Markdown targets. `--json` includes every file and repeat group. Resolves paths from the script, so it works outside the repository cwd. No writes, network or dependencies. Counts are source-size proxies, not model tokens; link checks exclude anchors, reference-style links and code examples.

Use the audit after changing instructions, shared references or routing. Preserve existing Spec Kit resolvers rather than duplicating feature-selection logic. Skills, plugins and Spec Kit files are outside this project-documentation audit.
