# Validation guide

Prerequisites: Docker и Python 3; repository dependencies установлены через make install.

1. `make check`: agents sync, typecheck, lint, format, behavioral tests, coverage floors проходят.
2. Targeted regressions: `docker compose run --rm app npm run test -- src/domain/create-entity-id.test.ts src/domain/move-key.test.ts src/domain/move-keys.test.ts src/domain/set-wire-bends.test.ts`.
3. Import race/resource/save tests используют реальный provider и File.text deferred promises; проверяют Project, saved JSON, announcements и recovery controls.
4. Gate fixture runner отклоняет каждый запрещённый пример ожидаемой диагностикой и принимает разрешённые; подключён в npm run check.
5. Benchmark 100 keys / 300 wires и stress inputs: `docker compose run --rm app node scripts/benchmark-project.mjs`; comparison: add `--analysis`. Численные budgets и результаты приведены в research.md. Исторические fixtures и golden bytes сохраняются.
6. `make test-mutations` запускать отдельно от edits/checks; seeds должны быть обнаружены, production files восстановлены.
7. После feature 023: `make zmk-build`; actual export проходит smoke matrix pinned ZMK v0.3. Намеренная DT/connector поломка должна отклоняться; сохранить environment pins и logs.

Закрытые пункты и непроведённые проверки отмечаются в tasks.md; исходный evidence audit-probes.test.ts.txt не включается в постоянный suite, поскольку утверждает наличие дефектов.
