# Rules for agents

- Не использовать Computer Use, CUA и управление обычным браузером или нативными приложениями без явного запроса пользователя. Автоматические Playwright-тесты через терминал разрешены в изолированном тестовом браузере (docs/testing.md); пользовательский профиль не использовать.
- Read the relevant `docs/zmk/*.md` page before touching anything that produces ZMK syntax. Do not write Devicetree/Kconfig from memory. Target is ZMK v0.3 — never emit anything marked "main only".
- Stay inside the task. No drive-by refactors, no renaming unrelated code, no new dependencies without docs/tooling.md approval.
- Write the test first for domain logic and generators; watch it fail; then implement. Tests live in `tests/unit/<layer>/<group>/` as `*.test.ts(x)`, mirroring the production groups; no tests in `src/`.
- Test observable behavior and product contracts (see `docs/testing.md`): real React/hooks/providers for UI interaction, roles and accessible names, visible state and saved/exported data. Do not mock React state or assert implementation details, Tailwind classes, or what the compiler/linter already guarantees.
- Keep coverage floors in `vite.config.ts` passing through `make check`. Use `make test-mutations` separately to verify regression sensitivity; never run it alongside other checks or edits to production files.
- Keep files small and named after what they contain. One exported concept per implementation file in `domain/` and `generators/`; `index.ts` files list the explicit public API.
- No comments that repeat code. Comment only non-obvious "why" (ZMK quirks, links to docs).
- Never commit generated `dist/`, `coverage/`, `node_modules/`.
- Commits: Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`, `test:`, `refactor:`), one logical change each.
- If a ZMK behavior is unclear, say so and link the doc page; do not guess.
