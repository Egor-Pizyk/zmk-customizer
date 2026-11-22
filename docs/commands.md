# Commands

Node 24 + npm. Use host commands when dependencies are installed, or Docker wrappers (`make sh` opens the prepared app container). Do not reinstall dependencies for each check.

## Inner loop

```sh
npm run test:unit:focus -- tests/unit/domain/keys/move-key.test.ts
npm run test:unit:focus -- tests/tooling/check-guidelines.test.mjs -t "local links"
npm run test:related -- src/domain/keys/move-key.ts
npm run test:watch -- tests/unit/domain/keys/move-key.test.ts
npm exec -- oxlint src/domain/keys/move-key.ts
npm exec -- oxfmt src/domain/keys/move-key.ts
npm run typecheck
npm run test:e2e:quick -- tests/e2e/wire-marquee.spec.ts -g "marquee starts beside"
```

Use focused/related tests immediately; no full-run prerequisite, staging, feature resolution or journal. Watch mode is useful while iterating. Browser commands build production output and use isolated contexts; normal user browser profiles are never touched.

`make test-unit-focus ARGS='tests/unit/domain/keys/move-key.test.ts'` runs the focused command in Docker. `make test-related ARGS='src/domain/keys/move-key.ts'` runs related units there. For a browser case use `docker compose -p zmk-customizer -f infra/compose.e2e.yaml run --rm e2e npm run test:e2e:quick -- tests/e2e/wire-marquee.spec.ts -g "marquee starts beside"`.

## Broader checks when needed

| Command | Scope |
|---|---|
| `npm run check` / `make check` | Architecture, app/E2E types, full lint/format; no tests |
| `npm run test:unit` / `make test-unit` | All app/golden and tooling units |
| `npm run test:coverage` | All app units and business-layer coverage |
| `npm run test:e2e` / `make test-e2e` | Full configured Chromium/Firefox/WebKit suite |
| `npm run test:tooling` | Node tooling tests |
| `npm run check:guidelines` | Effect inventory, configured rules and guideline links |
| `make zmk-build` | Compile actual exports in pinned ZMK v0.3 environment |
| `make test-mutations` / `make test-e2e-mutations` | Explicit behavioral sensitivity diagnostics; run alone |

Choose scope from the changed behavior. Full suites stay in CI; local broad checks are for broad/shared changes, failures or unresolved risks. Do not rerun a successful unchanged scope. `check:static` aliases `check`; `check:focus` aliases `test:unit:focus`.

## Optional staged checks

`npm run check:changed [-- --plan]` verifies exact staged bytes using a Docker snapshot, whole-project types/architecture and changed-file lint/format. `test:unit:changed` selects staged-impact units with safe full-unit fallback. Both preserve unstaged work and use separate cached receipts under `.check-logs/`; neither starts browsers. These are commit tools, not the everyday feedback loop.

`npm run hooks:install` opts into the static staged pre-commit hook. No automatic post-edit hooks or hidden test runs. Stage explicit paths; commits do not require a feature number, specification or completed cross-browser run. GitHub enforces final PR checks.

## Development

```sh
make up / down / logs / sh / install  # dev server http://localhost:5173
npm run dev / build / preview
npm run lint:fix / format            # explicit repairs; check never rewrites
make image / prod                   # production image http://localhost:8080
```

Container definitions: `infra/`; Compose project: `zmk-customizer`. Never use destructive cleanup to prepare checks. The formatter is oxfmt; Prettier is not installed.

Optional helpers: `bash scripts/agent-status.sh` shows branch/revision/diff without changing Git; `node scripts/audit-agent-context.mjs` checks instruction size, repeated prose and local links. No per-task journal or archived command transcript is required.
