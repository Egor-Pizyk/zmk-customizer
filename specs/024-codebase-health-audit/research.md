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
