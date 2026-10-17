# Implementation Plan: Codebase health audit

**Branch**: `024-codebase-health-audit` | **Date**: 2026-10-12 | **Spec**: [spec.md](spec.md)

## Summary

Закрыть A01–A12 небольшими проверяемыми изменениями. Снимок аудита и probes сохраняются; статус реализации ведётся в tasks.md. Порядок: сохранность данных, архитектурные gates, единые policy/analysis/draft contracts, независимые build/mutation проверки, документация.

## Technical Context

- TypeScript 7 strict, React 19, Node 24 в Docker, npm, Vite.
- Существующие React, zod, fflate; новых runtime dependencies нет.
- Статическое приложение; JSON/localStorage — trust boundary в storage.
- Vitest, Testing Library, golden fixtures, oxlint, oxfmt, Python tooling.
- Performance: измерить 100 keys / 300 wires и stress fixtures до выбора budgets и изменения analysis. Численные ограничения фиксируются в research.md по измерениям перед реализацией соответствующего gate; wall-clock thresholds не входят в unit tests.
- Scope: четыре воспроизведённых дефекта, архитектурные и проверочные A05–A12; будущие продуктовые features исключены.

## Constitution Check

До и после дизайна: PASS. Domain остаётся чистым; generators получают валидный Project; JSON формат и historical migrations сохраняются. Правила продукта принадлежат domain, ZMK facts — catalog. UI только оркестрирует. Проверки test-first для domain/generators, real provider UI tests; каждый gate имеет разрешённые/запрещённые fixtures. Coverage floors сохраняются. Завершение требует make check и отдельных mutation/build проверок. Browser/CUA не применяются.

## Project Structure

Используются существующие src/domain, src/catalog, src/storage, src/ui, scripts, tests/fixtures и .github/workflows. Новые файлы создаются только под конкретную задачу. Tests соседствуют с production modules; AST/graph tooling живёт в scripts, его fixtures — tests/fixtures/architecture.

Документы: spec.md/research.md/gates.md — исходный аудит; plan.md, data-model.md, quickstart.md и tasks.md — выполнение. В research.md новые решения добавляются отдельным разделом, исходные evidence не переписываются.

## Design decisions

- A01: decimal suffix через bigint только внутри allocator, результат string; занятые и сохраняемые reference IDs передаются allocator.
- A02: provider-lived request token и revision; успешный и ошибочный async result проверяют актуальность. Project edit/New/preset инвалидируют pending Open.
- A03: линейные bounds; общий resource budget на parse boundary после migration, до geometry; превышение возвращает readable error без truncation. Измерения и budgets — обязательный execution prerequisite.
- A04: shallow field comparisons в setters, исходная ссылка для no-op; history не делает deep equality.
- A06: существующий oxlint плюс resolved import/AST gate, используя доступный TypeScript tooling без новых runtime dependencies. Нормализованные пути, re-export/dynamic imports, aliases pure APIs, test-only allowances проверяются fixtures.
- A11: SaveError union invalid-project/storage-unavailable/quota-exceeded, безопасные reason/path; UI exhaustive mapping.
- A07: product policy в domain, board/version defaults в catalog/composition, frozen migrations неизменны.
- A05: analysis result связывает Project, contacts/nets/issues/matrix; UI/export используют согласованный результат. Cache только после baseline и с явно определённой геометрической зависимостью.
- A08: discriminated BindingDraft по behaviorId; таблица transitions до изменения UI.
- A09: работа принадлежит roadmap 023. Создать её spec/plan/tasks по текущему scope проверки сборки перед build code; 024 содержит dependency и evidence, не конкурирующую реализацию. Фактический generated repository проверяется pinned ZMK v0.3/toolchain.
- A10: реальные Problems/recovery/pointer tests и isolated sequential mutation CI job.
- A12: явная dependency matrix, effect registry, enforcement manifest; script сверяет проверяемые утверждения, review rules отмечены честно.

## Complexity Tracking

Нарушений constitution и новых framework abstractions нет. Внешний firmware build — tooling, не runtime network приложения.

## Follow-up implementation — 2026-10-15

Centralize the existing resource constants and resource query in domain/project; retain storage's public budget re-export and schema validation. Guard wire creation/bend edits/routing and reject any remaining resource-exceeding commit at the history boundary without Zod parsing. Keep accepted semantic conflicts editable. The allocator falls back to a free bounded decimal ID only when incrementing the highest imported ID would exceed the persisted limit.

Pass real BLE capability and precomputed nets through matrix/wiring derivation; UI wiring tables/grids consume the shared project analysis. Restrict engine modules plus explicitly permitted contracts in mixed query modules; shared modules cannot depend on workspaces/app composition. Document the effect gate as a file inventory.

No JSX-folder reorganization, runtime dependency, migration, generated syntax, geometry transform, golden fixture or coverage-floor changes. Existing output golden contracts protect byte equivalence; a fresh firmware compilation is unnecessary because no generated output/geometry changes. Extend the existing browser journey for bend budget refusal, exact storage/history preservation, recovery and JSON round trip. Run the full browser suite, three sequential executions of the new journey without retries, and an isolated controlled regression with exact restoration.
