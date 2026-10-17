# Доказательства и охват

## 1. Снимок

- Дата: 2026-10-12; HEAD `187f7e5db4032906e76f3baa8a395b8f9dc27c17`.
- Рабочее дерево до исследования чистое. Исследование не ограничивалось изменениями ветки.
- Инвентаризация: 457 `.ts/.tsx/.css` файлов в src, 27 216 строк; исключён `node_modules`.

| Слой | Production TS/TSX | Test files | Что проверялось |
|---|---:|---:|---|
| domain | 73 | 70 | идентичность сущностей, операции/undo, electrical graph, validation, чистота |
| catalog | 13 | 4 | default targets, pin maps, behaviors/keycodes, docs contracts, ownership |
| generators | 12 | 3 | входные контракты, deterministic output, golden/repository/controller cases |
| storage | 12 | 16 | schema/migrations, files/localStorage, backup, сериализация, ZIP |
| ui | 207 | 45 | providers, async actions, canvas/pointer, bindings drafts, export, primitives, recovery |
| composition/styles | 2 | — | startup/load, root boundary, tokens, build integration |

Дополнительно: AGENTS и path-scoped guidelines; docs/testing и ADR; roadmap/specs; `.oxlintrc.json`, `.oxfmtrc.json`, tsconfig/Vite/package scripts; CI, Docker/compose/nginx/Makefile; test helpers, fixture organization, mutation/agent-sync scripts, editor hooks.
Проверка CSS/CSP здесь статическая: внешний вид, contrast и browser runtime ею не доказаны.

## 2. Базовые проверки

| Проверка | Результат |
|---|---|
| `make check` | PASS до и после исследования: typecheck, lint, format, 138 test files / 859 tests + coverage |
| oxlint основного проекта | 0 warnings / 0 errors, 550 rules |
| coverage | lines 88.42%; statements 88.40%; functions 89.82%; branches 81.43% |
| Диагностический Vitest suite E1–E4 | 4/4 подтвердили дефекты; 531 ms на данном запуске, не performance baseline |
| Negative lint probes E5 | 0 warnings / 0 errors: архитектурные нарушения пропущены |
| ZMK firmware build | Не запускался; отсутствует в текущем CI |
| Mutation check | Не запускался в аудите; изучены seeds и способ запуска |

Диагностические файлы удалены из src после проверки. Приложение, lint и CI в рамках аудита не менялись.

## 3. Воспроизводимые дефекты

Точный выполненный тестовый файл: [evidence/audit-probes.test.ts.txt](evidence/audit-probes.test.ts.txt).
Он намеренно проверяет **текущее неправильное поведение**, поэтому не включён в постоянный test suite.
Для повторения скопировать его в свободный `src/storage/audit-probes.test.ts`, выполнить команду ниже и удалить только эту копию. Не перезаписывать одноимённый файл, если он уже существует.

```sh
docker compose run --rm app npm run test -- src/storage/audit-probes.test.ts
```

| Evidence | Сценарий | Наблюдение |
|---|---|---|
| E1 / A01 | parse JSON с key `k9007199254740992` → addKey → serialize | parse успешен; два одинаковых ID; сериализация отклонена |
| E2 / A02 | задержать File.text(A), завершить import B, затем A | итоговое имя A; history.past пуст |
| E3 / A03 | один wire, 150 000 bends `{xU: i % 2, yU: 2}`, файл <5 MiB | parse успешен; findCrossings бросает RangeError |
| E4 / A04 | history с redo → moveKey отсутствующего keyId | данные равны исходным; past вырос; future очищен |

E2 работает в Node environment; storage failure там обрабатывается штатным adapter и не влияет на проверяемый порядок замен Project. Реальный UI regression для исправления должен дополнительно подтвердить сохранённые данные и поведение controls.

## 4. E5 — Проверка самого lint

Временно созданы три файла:

```ts
// src/domain/audit-lint-probe.ts
export function readAuditStorage(): string | null {
  return localStorage.getItem('audit');
}

// src/storage/audit-lint-probe.ts
export { getWorkspaceLabel } from '../ui/workspaces';

// src/ui/components/audit-lint-probe.ts
export { useProject } from '../project-context';
```

Команда:

```sh
docker compose run --rm app npx oxlint src/domain/audit-lint-probe.ts src/storage/audit-lint-probe.ts src/ui/components/audit-lint-probe.ts
```

Фактический результат: `Found 0 warnings and 0 errors`, exit 0, 3 files / 550 rules.
Файлы удалены. Обходы через alias/globalThis/нормализованные пути перечислены как будущие fixtures, не как отдельно выполненные эксперименты.

## 5. Что намеренно не объявлено дефектом

- Отсутствие будущих layout/split/settings features — scope roadmap, а не технический долг текущей реализации.
- Наличие маленьких файлов, `ReturnType` и обычных exhaustive switches не требует массового рефакторинга.
- Runtime parsing pinned keys.h, deferred synchronous ZIP и exception root boundary имеют объяснения в коде; данных о необходимости их замены нет.
- Повторные вычисления A05 подтверждены по call graph; пользовательский lag и конкретное ускорение не измерялись.
- Допустимый JSON с domain issues должен по-прежнему открываться для исправления. Structural/resource rejection нельзя подменять запретом всех неэкспортируемых проектов.
- Проект не проходил независимую повторную сверку всех ZMK facts с upstream. A09 — отсутствие build gate; новых утверждений о ZMK-синтаксисе отчёт не вводит.

## 6. Implementation decisions (2026-10-12)

Baseline повторён: make check PASS, 138 files / 859 tests, floors сохранены. ID regressions сначала дали expected duplicate k/w/l выше 2^53; исправление bigint-local/string-result сохраняет round trip и existing reserved/dangling layer logic. No-op regressions сначала дали новую ссылку; single move теперь использует multi move.

Inventory: Project содержит keys/wires/insulatedCrossings/layers, каждый wire — bends, layer — bindings record, tap_dance — taps, stroke — modifiers (максимум восемь уникальных), crossing — fixed tuple. Строковые поля также ограничиваются file bytes. Structural references keys/wires schema уже проверяет; dangling layerId разрешён и резервируется addLayer. createFileActions пересоздаётся при state changes; session request/revision поэтому принадлежит стабильному provider-lived session (useMemo factory). getNets вызывается matrix и schematic validation; UI crossings — третий независимый analysis. Catalog default board и tap-dance limits/defaults дублируются. Existing exceptions: raw pinned keys.h asset, UI floating-panel CSSOM position, frozen migration literals.

A03 benchmark: `docker compose run --rm app node scripts/benchmark-project.mjs`, Node 24 Docker, три повтора, 100 keys. Для separated offsets (без early overlap exit): 300 wires / 0 bends — 9–25 ms, 9141 contacts; 300 / 4 bends (upper 3000 segments) — 238–273 ms, 235996 contacts; 600 / 4 — 974–1188 ms, 920390 contacts; 300 / 16 — 2776–3127 ms. Общие product resource budgets: 512 keys, 600 wires, 64 bends/wire, 3000 conservative orthogonal segments (2×(bends+1) на wire), 64 layers, 64 taps/binding, 8192 stored crossing exceptions, 512 binding entries/layer. Byte budget 5 MiB общий для file/localStorage; ID length 128, strings 4096. Эти ограничения допускают baseline 100/300 и ограничивают worst-case candidate comparisons; это не обещание frame latency для любой геометрии. Layer domain limit 32 остаётся validation issue; import допускает 64 для repair. Превышение не усекается. CPU/heap measurements зависят от машины; unit tests проверяют counts и rejection, не время.

## Shared analysis measurement

`docker compose run --rm app node scripts/benchmark-project.mjs --analysis`, same deterministic 100-key/300-wire/4-bend fixture, local Docker Node24: independent contacts/nets/schematic/shield consumers 1822 ms, shared analysis 352 ms. This is a single local comparative sample, not a CI timing assertion. Shared analysis computes contacts once, passes nets/issues/matrix down and retains the result per immutable Project in a WeakMap. No geometry-specific cache was added: no measured need justifies a second invalidation contract. Rename/binding edits receive their own full coherent analysis; reused Project objects on Undo retain their matching result. Golden outputs remain unchanged.

Normalized saved JSON also obeys the 5MiB byte budget. A compact input which would produce an oversized formatted saved file is rejected before replacement; invalid in-memory edits fail serialization without writing storage.

## Build verification (A09 / feature 023)

Implemented in separate branch 023-build-verification, commit cb46462. Official build image pinned by digest, ZMK edf5c0814fd3ea202e43aad2d68fd32e882a518c, Zephyr dacab4875df72109b96cc8977547a0dc04875bcd, SDK 0.16.3 and west 1.2.0. Committed resolved active manifest pins every dependency. All eight actual-export targets passed (nice_nano_v2, seeeduino_xiao, adafruit_kb2040, sparkfun_pro_micro_rp2040 × row2col/col2row); includes tap-dance and mod-morph. USB targets explicitly omit incompatible Bluetooth binding. Intentional audit_missing_connector was rejected. No generator text changes were necessary. CI has an always-completing job, relevant src/tests/scripts/config inputs, pinned cache key and always-uploaded evidence. Remote CI has not been run.

Mutation verification: 20/20 predefined regressions detected by failing test assertions; original source bytes restored. One initial survivor exposed a missing direct invalid-preview assertion; get-export-preview.test.ts now protects it. Bend limit mutation is checked at the per-wire boundary rather than a huge case also rejected by the aggregate budget. Mutation CI is a separate sequential checkout job.

## A01–A12 closure evidence

| Item | Implemented contract and evidence |
|---|---|
| A01 | Exact decimal bigint allocator; k/w/l, leading zeros, malformed suffixes, dangling/reserved references and imported edit/round-trip regressions. IDs never renumbered. |
| A02 | Provider-lived request/revision tokens; deferred imports in both completion orders, stale errors/retry, Open/New/edit/Undo cancellation and saved JSON assertions. |
| A03 | Measured trust-boundary resource budgets, bounded nested collections/strings/normalized bytes; file/localStorage/recovery tests and 150k-point stress regressions; min/max spread/apply guard. |
| A04 | Single/multiple key moves and bends return original Project on no-op. Domain, reducer/autosave and real pointer/bend/Redo tests protect the contract. |
| A05 | One contacts/nets/matrix/issues analysis shared by immutable Project identity. Electrical rules have one owner; UI import gate and invalid export contract. Local comparative benchmark 1822ms → 352ms. |
| A06 | Parser-based resolved imports/re-exports/dynamic edges, pure APIs/common aliases, production/test separation. Positive and diagnostic-specific negative fixtures; oxlint cycle checks retained. |
| A07 | Domain binding policy/predicate, catalog ZMK limits/default controller, explicit createProject composition input. Frozen migrations unchanged. |
| A08 | behaviorId discriminated draft branches, required mod-tap hold, guarded exhaustive picks. Existing real picker/selection/layer tests plus incompatible hold regression. |
| A09 | Feature 023, pinned official image and all dependency SHAs. Eight actual exports compile; intentional undefined connector rejected. CI inputs/cache/artifacts configured. |
| A10 | Real Problems navigation/focus, failed-save/backup recovery, pointer wire create/cancel and no-op behavior. 20 predefined mutation regressions detected by assertions. |
| A11 | SaveError invalid-project/storage-unavailable/quota-exceeded with preserved safe schema reason; invalid save does not write and Undo repairs state. |
| A12 | Dependency matrix and exact exceptions documented; production effect registry and enabled enforcement/link fixtures checked by check:guidelines; existing agent sync retained. |

Historical JSON migrations, upstream fixtures and expected generator bytes were not modified. No runtime dependency or schema version change. @babel/parser is a development dependency justified by ADR 0013. AST guards cover documented syntactic cases and common aliases; they do not prove all JavaScript data flow or semantic purity. Timing is local evidence, not a hard CI timing guarantee. No remote CI run or branch push is claimed.

## Final local verification

On the combined 024 branch (audit fixes + feature 023): `make check` passed 146 files / 909 tests, 35 architecture fixtures and 6 guideline fixtures; coverage 89.73% statements, 89.78% lines, 91.03% functions, 82.90% branches (all original floors preserved). `make test-mutations` detected 20/20 seeded regressions. `make zmk-build` passed 8/8 actual generated exports plus the intentional connector rejection with fully pinned dependencies. Final build evidence is in ignored `.zmk-build/{logs,artifacts,exports}`; reproduce with the commands in quickstart. All 32 tasks completed.

## Follow-up audit closure — 2026-10-15

This section appends to the historical A01–A12 evidence; it does not replace it.

### Corrected contracts

1. **Edit/save resources (A03/A07):** the existing resource constants now belong to `src/domain/project/project-budget.ts`, with the old storage entry retained as a public re-export. `getProjectResourceError` checks collection, bend/segment, nested text/ID and formatted UTF-8 byte budgets. Wire creation, bend edits and routing refuse oversized candidates. The history boundary checks remaining commits without Zod parsing and preserves the previous project, storage and undo/redo while announcing the reason. Both pointer completion and the keyboard bend editor explain refusal. Semantic/electrical conflicts remain editable.
2. **Bounded imported IDs (A01):** decimal BigInt allocation retains its previous behavior until incrementing would exceed 128 characters; it then selects a free bounded ID from the same supplied occupied/reserved set. Existing IDs/references remain unchanged. Tests cover k/w/l/t allocation plus imported maximal k/w/l IDs through actual add operations, reserved dangling layer IDs, save and reload.
3. **Actual controller capabilities:** `ShieldTarget` now carries real BLE support from the board. The matrix facade no longer fabricates `ble:true`. A split fixture with BLE disabled now reports the same unsupported capability through the facade as through direct derivation.
4. **Shared explicit-wiring analysis (A05):** precomputed nets flow through `deriveShieldMatrix`, `deriveWiring` and `getWiringCells`. The extra contact/net passes are removed. Wiring grids/tables read the shared analysis for their actual Project (including preview Projects), rather than recomputing nets.
5. **Architecture contracts (A06):** entire engine modules are unavailable to UI at runtime; mixed wire/crossing modules grant only explicit UI-safe contracts. Only project-state invokes domain analysis. Shared UI modules cannot import workspaces or app composition. Negative fixtures cover `deriveWiring`, `getWiringCells`, direct `analyzeProject` and shared preferences → workspace imports. Existing origin/re-export/dynamic import protections remain active.
6. **Truthful effect inventory (A12):** the documentation now states exactly what check:guidelines proves: the set of files containing effects. A test preserves this inventory guarantee; purpose, additional effects inside a listed file and cleanup remain review responsibilities.

### Verification

- Tests-first evidence: the initial focused run failed seven intended assertions (four ID prefixes, add-wire, bend editing, BLE facade); both new architecture probes failed before the gate repair. The later pointer byte-boundary regression also failed first because no refusal hint was emitted, then passed after repair. Local logs: `/tmp/zmk-fixes-red.log`, `/tmp/zmk-fixes-gates-red.log`, `/tmp/zmk-fixes-pointer-red.log`.
- Final `make check` **passed**, 176 files / 1037 tests. Coverage: 90.94% statements, 90.88% lines, 91.90% functions, 84.11% branches. All original coverage floors remain unchanged. Log: `/tmp/zmk-fixes-check-final-bytes.log`.
- Final stable `make test-e2e` **passed 85/85** across Chromium and focused Firefox/WebKit. The new resource journey then passed two additional sequential Chromium runs without retries: three sequential passes including the full-suite pass. Logs: `/tmp/zmk-fixes-e2e-stable.log`, `/tmp/zmk-fixes-e2e-repeat-2.log`, `/tmp/zmk-fixes-e2e-repeat-3.log`.
- The browser journey verifies refusal at 64 → 65 bends, the readable live announcement, unchanged saved project and Redo, repair to 63 and successful return to 64, and actual JSON download/import. A separate pointer contract starts with a schema-saveable Project at exactly 5 MiB and verifies that a coordinate edit which increases serialized bytes explains refusal and dispatches no history change.
- Isolated sensitivity check **passed** through the existing `checkSeed`/`withSourceMutation` runner. Seed `lost-resource-explanation` changed the keyboard bend preflight to inspect the old bends instead of proposed bends. The browser test failed its required visible `toContainText` assertion (expected the 64-bend explanation, received the previous “Undone” announcement); compiler/runner errors did not count. Evidence: `.e2e-mutations/lost-resource-explanation/{report.json,runner.log,artifacts}`. Aggregate SHA-256 of all production TS/TSX source files matched before/after: `e77ec33547bb98b4e44760b1fbc86e056daa5e716409bd5f9a2019f48cbb7506`. Log: `/tmp/zmk-fixes-sensitivity.log`.
- Production `npm run build` in Docker **passed after source restoration**. It retains the existing large-chunk warning (666.71 kB JavaScript before gzip); no dependency or chunking changes were included. Log: `/tmp/zmk-fixes-build-final.log`.
- `git diff --check` passed. No commit, push or remote CI execution is claimed.

Early verification attempts are retained separately: one new browser assertion incorrectly compared the download helper's JSON string with a Project and was corrected to a real download/import round trip; a later suite overlapped a helper relocation and its next browser workers encountered stale module paths. Neither attempt is treated as final verification. The final stable suite and subsequent checks ran without production edits or concurrent mutations.

### Timing and limits

`node scripts/benchmark-project.mjs --analysis` now includes explicit matrix/direct × unibody/split fixtures: six keys / twelve wires each, locally 1–2 ms. This establishes coverage of the modern execution path, not a large-wiring performance guarantee. The existing 100-key / 300-wire legacy comparison measured 1151 ms for independent consumers versus 265 ms for shared analysis on this host. Timing is informational, with no flaky CI wall-clock assertion.

Historical migrations, schema version, dependencies, layout transforms, generator syntax and golden expected bytes were not changed. Existing matrix/export/golden and browser ZIP contracts pass. A fresh `make zmk-build` was not required or run because this follow-up changes resource/capability validation and analysis ownership, not generated output or exported geometry. Browser automation does not establish screen-reader speech or physical firmware behavior. No broad reverse folder reorganization was undertaken.
