# Tasks: Codebase health audit

**Input**: spec.md, plan.md, research.md, data-model.md, gates.md, quickstart.md в `specs/024-codebase-health-audit/`.
**Tests**: обязательны по spec §3 и AGENTS; domain/generators test-first, реальные provider/controls для UI. `[P]` обозначает независимые файлы после prerequisites; mutation runs всегда последовательны.
**Status**: complete; 32/32 tasks verified. Local validation and limitations are recorded in research.md. Исходные T01–T12 заменены перечисленными ниже задачами с A-traceability.

## Phase 1: Setup

- [x] T001 Проверить исходный audit evidence и создать feature branch/дизайн в specs/024-codebase-health-audit/plan.md, data-model.md, quickstart.md.
- [x] T002 Зафиксировать текущий make check и исходный baseline в specs/024-codebase-health-audit/research.md.

## Phase 2: Foundation

- [x] T003 Проверить реальные импортируемые сущности, nested arrays, policy/analysis owners и существующие exceptions; записать inventory в specs/024-codebase-health-audit/research.md без изменения исторического evidence.

## Phase 3: US1 — Сохранность проекта (P1, MVP)

**Goal**: A01–A03. **Independent test**: imports/edit/round trip сохраняют IDs и актуальную ревизию; complexity rejection не заменяет текущий Project.

- [x] T004 [P] [US1] Добавить failing A01 regressions для k/w/l, 2^53, длинных suffix, leading zeros, dangling/reserved references в src/domain/create-entity-id.test.ts и src/storage/project-file.test.ts.
- [x] T005 [US1] Исправить точный string ID allocation и reference reservations в src/domain/create-entity-id.ts, add-key.ts, add-wire.ts, add-layer.ts; не перенумеровывать сохранённые IDs.
- [x] T006 [P] [US1] Добавить deferred A/B (оба completion orders), Open/New/edit, stale failure/retry tests с real provider и saved JSON в src/ui/app-project-files.test.ts.
- [x] T007 [US1] Ввести provider-lived import request/revision token и cancellation announcement в src/ui/project-context.tsx и src/ui/project-file-actions.ts.
- [x] T008 [US1] Измерить 100 keys/300 wires и stress fixtures, inventory всех nested input collections; зафиксировать численные budgets и runnable benchmark в scripts/benchmark-project.mjs и specs/024-codebase-health-audit/research.md до resource gate.
- [x] T009 [US1] Добавить failing E3 и budget boundary/file/localStorage/recovery/historical fixture tests в src/domain/find-crossings.test.ts, src/storage/parse-project-file.test.ts и src/ui/app-project-files.test.ts.
- [x] T010 [US1] Убрать unbounded argument spread в src/domain/find-wire-contacts.ts; применять измеренный общий resource contract в src/storage/parse-project-file.ts и project-schema.ts без truncation/domain-issue rejection.

## Phase 4: US2 — Проверяемые границы (P1)

**Goal**: A06, G01–G04. **Independent test**: gate fixtures проверяют конкретную диагностику запрещённых import/purity/allocator/spread patterns и разрешённые пары.

- [x] T011 [US2] Добавить failing resolved imports/re-export/dynamic/normalized-path и pure API/globalThis/alias fixtures в tests/fixtures/architecture/ и scripts/check-architecture.test.mjs.
- [x] T012 [US2] Реализовать resolved dependency/purity gate с narrow allocator/spread checks в scripts/check-architecture.mjs; обновить .oxlintrc.json по gates.md, сохранить import/no-cycle и test-only allowances.
- [x] T013 [US2] Подключить fixtures и architecture gate в package.json check; документировать точные exceptions с причиной/владельцем/removal condition в docs/guidelines/code-quality/typescript.md.

## Phase 5: US3 — История и причины сохранения (P2)

**Goal**: A04, A11. **Independent test**: no-op сохраняет identity/redo/autosave; invalid-project не пишет storage и имеет отличимую UI diagnosis.

- [x] T014 [P] [US3] Добавить failing unknown/identical/empty moves и bends regressions в src/domain/move-key.test.ts, move-keys.test.ts, set-wire-bends.test.ts; проверить redo/autosave в src/ui/project-noops.test.ts и app-canvas.test.ts.
- [x] T015 [US3] Единый no-op contract single/multi move и bends в src/domain/move-key.ts, move-keys.ts, set-wire-bends.ts без deep equality history.
- [x] T016 [P] [US3] Добавить invalid-project/quota/unavailable no-write и recovery message tests в src/storage/project-storage.test.ts и src/ui/app-storage.test.tsx.
- [x] T017 [US3] Разделить SaveError kinds с безопасным path/reason в src/storage/project-storage.ts; exhaustive UI messages/recovery в src/ui/shell/project-bar.tsx и project-messages.tsx.

## Phase 6: US4 — Единые policy и analysis (P2)

**Goal**: A07, A05; зависит от US2. **Independent test**: boundary predicates/defaults едины; issues/golden/matrix совпадают; benchmark до/после приложен.

- [x] T018 [US4] Зафиксировать product vs ZMK ownership inventory и integer/range/default failing tests в specs/024-codebase-health-audit/research.md, src/domain/validate-bindings.test.ts и src/domain/create-project.test.ts.
- [x] T019 [US4] Централизовать product limits/defaults и predicates в src/domain/binding-policy.ts; передать catalog default board через composition в src/domain/create-project.ts, src/storage/project-storage.ts и UI consumers; frozen migrations сохранить.
- [x] T020 [US4] Добавить analysis behavioral/matrix/invalid export contract regressions в src/domain/analyze-project.test.ts и src/ui/export/get-export-preview.test.ts; записать исходный benchmark в specs/024-codebase-health-audit/research.md.
- [x] T021 [US4] Создать согласованный pure analysis в src/domain/analyze-project.ts; убрать повторные electrical rules/pipelines в validate-shield-project.ts, validate-schematic.ts, derive-shield-matrix.ts; consumers project-state.ts, schematic-canvas.tsx и export/get-export-preview.ts получают один результат.
- [x] T022 [US4] Ограничить UI low-level analysis imports в scripts/check-architecture.mjs; проверить unchanged golden bytes и benchmark после в specs/024-codebase-health-audit/research.md; geometry cache вводить только при измеренной необходимости с rename/binding edit regression.

## Phase 7: US5 — Draft и recovery flows (P2)

**Goal**: A08, A10; policy после US4, regression seeds после US1/US3. **Independent test**: transitions и реальные Problems/recovery/pointer controls защищены чувствительными tests.

- [x] T023 [US5] Описать behavior-specific transition table в specs/024-codebase-health-audit/data-model.md; проверить commit/cancel/layer switch/deletion/selection flows в src/ui/bindings/draft-state.test.ts и app-bindings.test.ts, добавить failing incompatible hold pick в pick-slot.test.ts.
- [x] T024 [US5] Преобразовать BindingDraft в behaviorId discriminated union и exhaustive transitions в src/ui/bindings/draft-state.ts и связанных picker consumers без optional bag.
- [x] T025 [US5] Добавить Problems focus return, failed autosave/backup recovery, pointer create/cancel/bend no-op tests в src/ui/app-problems.test.ts, app-storage.test.tsx и app-canvas.test.ts с saved JSON assertions.
- [x] T026 [US5] Расширить seeds E1–E4/error mapping/draft/recovery в scripts/check-test-mutations.py; gate React hook mocks/skip/only fixtures в scripts/check-architecture.test.mjs; isolated sequential mutation job в .github/workflows/ci.yml.

## Phase 8: US6 — Сборка actual export (P1, dependency 023)

**Goal**: A09. **Independent test**: actual generated output собирается pinned upstream; intentional malformed output ломает gate.

- [x] T027 [US6] Создать spec/plan/tasks feature 023 в specs/023-build-verification/ по docs/roadmap.md; прочитать docs/zmk/README.md, boards.md, shield-files.md перед build implementation, сверить pinned upstream факты.
- [x] T028 [US6] Через задачи feature 023 добавить actual export fixture generation, pinned ZMK/Zephyr/toolchain environment, make zmk-build и CI smoke всех четырёх board targets, обеих diode directions и используемых custom behaviors в scripts/, Makefile и .github/workflows/ci.yml.
- [x] T029 [US6] Проверить intentional connector/DT failure, cache-key pins, relevant path coverage/always completed required status; записать build logs/environment/evidence в specs/023-build-verification/quickstart.md и specs/024-codebase-health-audit/research.md.

## Phase 9: US7 — Исполняемые инструкции (P3)

**Goal**: A12; зависит от US2/US4–US6. **Independent test**: registry и enforced claims совпадают с production/config, links и mirrors проходят.

- [x] T030 [US7] Добавить failing effect registry/enforcement/link consistency fixtures в scripts/check-guidelines.test.mjs и tests/fixtures/guidelines/.
- [x] T031 [US7] Синхронизировать dependency matrix в AGENTS.md, effect registry в docs/guidelines/frontend/react.md и enforcement manifest в docs/guidelines/code-quality/control-flow.md; выполнить script scripts/check-guidelines.mjs в package.json check, не дублировать нормативные тексты в skills.

## Phase 10: Polish

- [x] T032 Выполнить quickstart и make check; отдельно make test-mutations и make zmk-build; зафиксировать actual results/limitations и A01–A12 closure evidence в specs/024-codebase-health-audit/research.md.

## Dependencies and execution order

Setup → Foundation → US1 MVP → US2 → US3 → US4 → US5 → US6 (feature 023) → US7 → Polish. US3 можно выполнять после Foundation независимо от US2; US6 design может начаться после Foundation. A11 implementation следует A01; analysis следует policy и architecture; mutation follows protected regressions. Внутри story failing test предшествует production fix, затем targeted checks и make check.

## Parallel examples

После foundation: US1 T004 (ID tests) и T006 (UI import tests) работают с разными файлами. US2 fixtures идут после US1 budgets для G04. US3 T014 (no-op tests) и T016 (storage tests) независимы. US4 policy и analysis последовательно из-за общих validators. US5 draft tests и Problems tests могут писаться отдельно после US4, mutation выполняется один. US6 build environment research независим от draft. US7 docs fixtures независимы от чтения existing effect registry; shared scripts edits выполняются последовательно. Эти возможности не требуют запуска дополнительных агентов.

## Implementation strategy

Сначала US1 как MVP сохранности данных; затем каждый story имеет собственный checkpoint и проверки. Не объявлять A09 закрытым по golden tests. Не включать диагностические probes, утверждающие дефекты, в постоянный suite. Полный closure требует всех 32 tasks, unchanged historical fixtures/JSON/golden либо объяснённой migration и build evidence.

## Follow-up corrections — 2026-10-15

- [x] T033 Add failing maximum-length allocator, wire/bend budget and BLE facade regressions; retain baseline failures as local evidence.
- [x] T034 Centralize resource policy; guard wire edits/routing and history commits with readable refusal and unchanged history/storage; cover count/segment/text/UTF-8 byte limits and repaired edits.
- [x] T035 Preserve bounded allocation and reserved references through import → edits → serialize → import.
- [x] T036 Propagate actual capabilities and shared nets through explicit wiring; consume analysis in UI wiring grids/tables and extend modern-wiring benchmark.
- [x] T037 Close engine/shared-UI import bypasses with negative fixtures; document effect inventory limits and test the actual guarantee.
- [x] T038 Verify final make check/build/full browser suite, three sequential new-journey passes and isolated regression sensitivity/restoration; append results and limitations to research.md.
