# Ограничения для агентов и проект gates

Статус: реализованные gates; нормативная матрица — AGENTS §3.1, конкретные проверки и исключения — path-scoped guidelines. Связь с проблемами — A01–A12 в [spec.md](spec.md).

## 1. Матрица production-зависимостей

Правило применяется к нормализованной цели `import`, `export ... from`, `import()`; type-only импорт также проверяется. Tests получают отдельные разрешения, production не импортирует tests.

| Откуда | Разрешено внутри проекта |
|---|---|
| domain | domain |
| catalog | catalog, только типы domain; собственные pinned data assets |
| generators | generators, domain, catalog |
| storage | storage, domain, catalog, generators |
| ui/components | ui/components |
| ui/canvas, ui/shell | свой shared-код, primitives, domain/catalog/storage, явно перечисленные корневые UI-контракты/providers; без feature folders |
| ui/schematic, ui/bindings, ui/firmware | собственная feature, shared UI, корневые providers/контракты, domain/catalog/storage |
| ui/export | то же; generators только из одной точки подготовки export |
| ui/*.tsx, ui/*.ts | композиция перечисленных слоёв; исходящие импорты из неё не дают обратного разрешения |
| main.tsx | composition root: UI/storage и необходимые defaults из catalog |

Внешние зависимости: текущий allowlist AGENTS §4. React/DOM разрешены в UI; zod/fflate — по их назначению на storage boundary. Standard JS (`Map`, `Set`, `TextEncoder`) не считать I/O. Нового service framework не требуется.

## 2. Автоматические проверки

Имена `project/*` ниже **предлагаемые**, таких правил сейчас нет. Реализацию выбрать между локальным oxlint JS plugin и отдельным AST/graph script. Не добавлять несуществующее правило в конфиг. Каждый gate имеет положительные и отрицательные fixtures.

| Gate | Что внедрить | Должен отклонять | Связь |
|---|---|---|---|
| G01 imports | Расширить `eslint/no-restricted-imports`; resolved graph script по матрице; сохранить `import/no-cycle` | storage→UI, primitive→provider/catalog, feature→другая feature, обход через re-export/нормализацию пути | A06 |
| G02 purity | В pure folders расширить `eslint/no-restricted-globals`, `eslint/no-restricted-properties`, imports для `node:*`, React и I/O packages; AST для aliases | `localStorage`, `document`, `window`, `navigator`, network, timers, `new Date()` без аргументов; `globalThis.localStorage`; destructuring alias | A06 |
| G03 IDs | Узкий `project/no-lossy-id-arithmetic` в allocator | `Number`/`parseInt` суффикса ID | A01 |
| G04 input cost | `project/no-unbounded-argument-spread`; budgets на trust boundary | `Math.max(...projectArray)` и эквивалентные вызовы; превышение согласованных complexity limits | A03 |
| G05 ownership | Import allowlist для нижних стадий анализа; domain/catalog policy contract tests | прямую сборку независимого validation pipeline в новой UI feature | A05, A07 |
| G06 states | TypeScript union + exhaustive switches; при необходимости узкое правило для BindingDraft | объединение несовместимых draft полей в общий optional bag | A08 |
| G07 behavior | Регрессии E1–E4, error-kind mapping, recovery, draft transitions; test mock policy | stale import replacement, no-op history change, React hook mocks вместо поведения, необоснованные skip/only | A01–A04, A08, A10, A11 |
| G08 ZMK build | Отдельный CI job / `make zmk-build` из roadmap 023 | несобирающийся фактический export | A09 |
| G09 mutation | Изолированный последовательный job seeded mutations | выжившую заранее определённую бизнес-регрессию | A10 |
| G10 docs | Проверка effect registry, ссылок и enforcement manifest | undocumented production effect, «enforced» rule без конфигурации/проверки | A12 |

Уточнения:

- G02 не запрещает локальные mutable collections для построения результата и фиксированную ZIP timestamp в storage. Запрет `Date.now`/`Math.random` уже есть — его не выдавать за новую работу.
- G03 не заменяет доказательство уникальности. G04 не заменяет stress test. G06 не доказывает корректность переходов. Не называть lint гарантией бизнес-семантики.
- Не включать глобальные `no-magic-numbers`, новые жёсткие лимиты строк/числа файлов или blanket запреты `catch`/`useEffect`: это не закрывает найденные дефекты.
- `ReturnType<typeof hook>` и маленький файл сами по себе не являются проблемой. Рефакторить связанность и контракт, а не подгонять метрики размера.
- Не делать schema источником domain types: domain должен оставаться независимым от storage/zod. Не расширять сферу сериализуемого Project transient UI-состоянием.

## 3. Негативные fixtures для архитектурного gate

| Размещение | Запрещённый пример | Ожидаемая причина |
|---|---|---|
| domain/probe.ts | `localStorage.getItem('x')` | pure layer I/O |
| domain/probe.ts | `globalThis.localStorage.getItem('x')` | pure layer I/O |
| domain/probe.ts | `import { readFile } from 'node:fs/promises'` | pure layer external I/O |
| storage/probe.ts | `export { getWorkspaceLabel } from '../ui/workspaces'` | reversed layer edge |
| ui/components/probe.ts | `export { useProject } from '../project-context'` | primitive coupled to application state |
| ui/schematic/probe.ts | импорт bindings через относительный путь с `..` | cross-feature edge |
| production file | импорт `tests/helpers/*` | test dependency in production |

Для каждого запрета добавить разрешённую пару: domain→domain, catalog→domain `import type`, UI→domain, primitive→primitive, test→Node fixture reader. Проверять не только exit code, но и ожидаемую диагностику: fixture не должен «проходить проверку запрета» из-за синтаксической ошибки.

## 4. Текст ограничения для будущей задачи агенту

> До изменения определи владельца правила и затрагиваемый контракт. Используй матрицу зависимостей; не дублируй policy в UI и storage. Сохраняй сериализуемость, исторические миграции и no-op identity. Асинхронный ответ не может заменять более новую ревизию Project. Ввод пользователя имеет структурный и вычислительный бюджет. Сначала воспроизведи нарушение контрактным тестом, затем исправь минимально. Новый gate проверь разрешённым и запрещённым примером. Не ослабляй coverage/lint ради прохождения. Для генераторов приложи golden diff и результат pinned ZMK build. Заверши `make check`; явно укажи непроведённые проверки.

Этот блок — проект дополнения к нормативным файлам, не замена AGENTS. При реализации распределить правила по существующим path-scoped guidelines; в AGENTS оставить ссылки. Для каждого A-пункта дополнительно применяется его конкретное «Ограничение агенту» из spec.

## 5. Включение в CI

1. Сначала закрыть P1 дефекты и добавить G01/G02 с fixtures; не включать gate, пропускающий текущие нарушения через общий allowlist.
2. Включить быстрые G01–G07/G10 в `npm run check` и, следовательно, `make check`. Порядок: gate fixtures/architecture → typecheck/lint/format → behavioral tests/coverage.
3. G08/G09 — отдельные jobs. Mutation выполняется один, в своём checkout; никаких одновременных изменений production файлов или других проверок в этом checkout.
4. Для path-filtered ZMK job учесть все входы: generators, output-related domain/catalog/storage, fixtures, build scripts/config. Required status должен завершаться и при отсутствии релевантных изменений.
5. Исключение: точный путь/правило, причина, владелец, условие удаления и positive fixture. Запрещены широкие `off`, понижение floors и новый baseline «всё существующее разрешено».
