# Audit validation guide

Use an isolated checkout/context at the journal's reviewed revision. Follow `docs/testing.md`; ordinary browser profiles are outside this audit authorization.

1. Read `coverage.md` for the tested environments and gaps; read `findings.md` for source reports and proposed acceptance.
2. Existing browser journeys run with `docker compose -p zmk-customizer -f infra/compose.e2e.yaml run --rm --entrypoint sh e2e -c 'npx playwright test --project=chromium'`. This builds the production app through Playwright's webServer; it modifies only ignored outputs. Scope and results are in the journal.
3. For each reported bug, reproduce against its exact recorded project with real mouse/keyboard/file import. Compare visible geometry, persisted project, preview/Apply/Cancel and Undo/Redo. Do not inject state or call domain operations from the page.
4. Review retained screenshots/logs identified in the journal. They are local ignored research evidence, not portable committed fixtures or proof of manual speech/zoom checks.
5. Before any 036 fix, resolve the finding's material decisions and add its independent failing regression under the owning feature's plan. Research observations do not authorize code changes.
