# Аудит технического состояния проекта

Дата: 2026-10-12. Статус: исследование завершено; исправления и новые gates **не внедрены**.
База: `187f7e5db4032906e76f3baa8a395b8f9dc27c17`, ветка `011-controller-boards`.
Область: весь текущий проект, не diff ветки. Номер 024 выбран после номеров 001–023, занятых roadmap.

## 1. Результат и границы

12 пунктов: 4 воспроизведённых дефекта, 5 архитектурных проблем, 3 пробела в проверках/правилах.
Переписывать приложение не требуется: чистые domain/generators, миграции, golden tests и реальные UI-тесты уже существуют.
Основная работа — закрыть границы данных и асинхронных операций, убрать дублирование правил, сделать архитектурные ограничения исполняемыми.

Проверены все слои через инвентаризацию, поиск зависимостей/опасных конструкций и разбор ключевых цепочек выполнения; это не утверждение о ручном чтении каждой строки или отсутствии других ошибок.
Отложенные split, layout editor, Firmware settings и другие возможности roadmap не считаются дефектами.
CUA/браузер не использовались. Прошивка не компилировалась.

| Приоритет | Значение |
|---|---|
| P1 | Потеря/повреждение состояния, падение на разрешённом вводе либо отсутствие критической защиты |
| P2 | Усложнение изменений, неоднозначные контракты, существенная неполнота регрессий |
| P3 | Дрейф документации и правил разработки |

| ID | Приоритет | Класс | Проблема |
|---|---|---|---|
| A01 | P1 | Дефект | Импортируемый ID ломает уникальность новых сущностей |
| A02 | P1 | Дефект | Устаревший импорт перезаписывает новый проект |
| A03 | P1 | Дефект | Допустимый JSON обрушает расчёт геометрии |
| A04 | P2 | Дефект | Пустая операция расходует undo и уничтожает redo |
| A05 | P2 | Архитектура | Повторный анализ схемы и раздельные project/issues/matrix |
| A06 | P1 | Gate | Lint не гарантирует заявленные границы слоёв |
| A07 | P2 | Архитектура | Ограничения и значения по умолчанию рассеяны по слоям |
| A08 | P2 | Архитектура | Модель черновика допускает несовместимые состояния |
| A09 | P1 | Gate | Golden tests не подтверждают сборку ZMK |
| A10 | P2 | Gate | Общий coverage скрывает непроверенные пользовательские цепочки |
| A11 | P2 | Архитектура | Ошибка сериализации маскируется под блокировку storage |
| A12 | P3 | Архитектура правил | Инструкции расходятся с кодом и lint |

## 2. Требования к исправлениям

### A01 — Уникальность ID после импорта

- **Где:** `src/domain/create-entity-id.ts:2`; `src/storage/project-schema.ts` (`id` для key/wire/layer); `add-key.ts`, `add-wire.ts`, `add-layer.ts`.
- **Доказательство:** JSON с `k9007199254740992` принимается. `Number(id suffix) + 1` даёт то же число; `addKey` создаёт второй такой ID. `serializeProject` затем отклоняет проект. Probe E1.
- **Последствие:** ломаются адресация bindings/wires и сохранение. Ещё большие числа могут превратиться в экспоненциальную запись, не соответствующую схеме ID.
- **Исправление:** выделять ID без потери точности — например, сравнение/инкремент через локальный `bigint` с возвратом строки. В `Project` bigint не хранить. Проверять занятость результата; учитывать dangling/reserved layer IDs. Существующие ID не перенумеровывать.
- **Ограничение агенту:** «ID — непрозрачная строка. Не преобразовывать суффикс в Number. Новая сущность не использует ID существующей сущности или сохраняемой ссылки».
- **Lint / gate:** локальное AST-правило для allocator запрещает `Number`/`parseInt` при обработке ID; основная защита — domain + import/edit/serialize regression tests. Универсальный lint уникальность не доказывает.
- **Приёмка:** k/w/l, границы `2^53`, длинные числа, ведущие нули, dangling/reserved IDs; последовательные добавления уникальны, round trip сохраняет ссылки.

### A02 — Гонка открытия проектов

- **Где:** `src/ui/project-file-actions.ts:33`; `src/ui/shell/project-dialogs.tsx`, `ProjectFileInput`; `src/ui/project-context.tsx`.
- **Доказательство:** начать чтение A, открыть B, завершить A → текущий проект A, история пуста. Probe E2. `await readImportFile` не проверяет актуальность операции перед `replace`.
- **Последствие:** более поздний импорт, New или правки могут быть затёрты старым ответом; undo не возвращает заменённый проект.
- **Исправление:** хранить generation/request token на срок жизни provider, а не внутри пересоздаваемого `createFileActions`. Новый Open/New/preset и изменение текущего проекта инвалидируют незавершённое чтение. Перед применением success **и** failure проверять token. Устаревший ответ игнорировать; отмену из-за правки сообщать пользователю.
- **Ограничение агенту:** «Асинхронная замена Project применяется только к актуальной сессии и ревизии. Замыкание на latest state не защищает от устаревшего результата».
- **Lint / gate:** штатного правила для этой гонки нет. Обязательны deferred-promise tests на границе `File.text`; React/provider и операции не мокать.
- **Приёмка:** A→B в обоих порядках завершения; Open→New; Open→edit; устаревшая ошибка не закрывает новый успешный проект; retry работает.

### A03 — Нет безопасного бюджета сложности входных данных

- **Где:** `src/storage/read-import-file.ts:5`, `project-schema.ts` (`wires[].bends`); `src/domain/find-wire-contacts.ts:45`; `src/storage/parse-project-file.ts`.
- **Доказательство:** 150 000 чередующихся bends одного провода, файл <5 MiB: parse успешен, `findCrossings` бросает `RangeError`. Причина — `Math.min(...xs)` / `Math.max(...xs)`. Probe E3.
- **Последствие:** импортируемые данные проходят trust boundary, затем ломают анализ/рендер. Ограничение байтов не ограничивает стоимость попарных сравнений сегментов; localStorage идёт прямо через `parseProjectFile`.
- **Исправление:** считать bounds циклом без spread аргументов; перед геометрией проверять количество сущностей, bends на провод и суммарных сегментов. Общую проверку применять к файлу и localStorage. Численные бюджеты выбрать по измерениям на fixture 100 keys / 300 wires и стресс-наборах; зафиксировать их до реализации gate. Превышение возвращает читаемую ошибку, не усечение данных.
- **Ограничение агенту:** «Размер JSON не является бюджетом вычислений. Не передавать массивы пользовательского размера через spread в вызовы. Новый вложенный массив требует явного бюджета обработки».
- **Lint / gate:** proposed `project/no-unbounded-argument-spread` для массивов project data; без анализа происхождения данных допускается узкий запрет `Math.min/max(...array)`. Stress tests и тесты превышения каждого бюджета обязательны.
- **Приёмка:** E3 перестаёт падать; допустимые большие проекты обрабатываются, превышение бюджета оставляет текущий проект неизменным; исторические fixtures загружаются.

### A04 — Несогласованный контракт no-op

- **Где:** `src/domain/move-key.ts:4`, `move-keys.ts:4`, `set-wire-bends.ts:4`; `src/ui/project-history.ts:19`.
- **Доказательство:** `moveKey` с отсутствующим ID возвращает равный по данным новый Project. History добавляет undo и очищает redo. Probe E4. Аналогичное безусловное создание объектов есть в двух остальных операциях.
- **Последствие:** корректность истории зависит от того, отфильтровал ли каждый UI-handler пустое действие.
- **Исправление:** domain setters возвращают исходную ссылку для неизвестной цели и неизменившихся значений; `moveKey` использует единый контракт перемещения с `moveKeys`. Не добавлять полное deep equality в history.
- **Ограничение агенту:** «Операция без изменения данных возвращает исходный Project. UI не отвечает за целостность undo/redo. Сравнивать только затронутые поля».
- **Lint / gate:** штатного sound-правила нет; параметризованные tests для setters + history, включая пустой moves и идентичные bends.
- **Приёмка:** no-op не создаёт undo, не стирает redo, не запускает autosave; настоящее изменение остаётся одним undo-шагом.

### A05 — Анализ схемы вычисляется и проверяется в нескольких местах

- **Где:** `src/domain/validate-shield-project.ts:61`, `validate-schematic.ts:198`, `derive-shield-matrix.ts:251`; `src/ui/project-state.ts:78`; `src/ui/export/get-export-preview.ts:10`; `src/ui/schematic/schematic-canvas.tsx`.
- **Доказательство:** validateShieldProject → deriveShieldMatrix → getNets; затем validateProject → validateSchematic → getNets повторно. Preview снова выводит matrix. Проверки `board-pin-conflict`, `board-pins-shorted`, `keys-in-parallel` дублируются и затем дедуплицируются. UI отдельно считает crossings. WeakMap кеширует итоговые issues, но не эти повторения внутри анализа.
- **Риск:** рост стоимости при новых validators; два владельца одного правила; API preview принимает Project и независимый массив issues, не связанный с его ревизией. Ошибка актуальности issues сегодня не воспроизведена.
- **Исправление:** чистая domain-функция анализа возвращает согласованные contacts/nets/issues и matrix result. Общие electrical rules выполняются один раз. UI оркестрация хранит результат для конкретного immutable Project; экспорт получает этот же результат. Генераторы остаются чистыми и не валидируют. Графику диодов не смешивать с электрической моделью.
- **Ограничение агенту:** «Одно правило — один владелец. Новый consumer использует результат анализа текущего Project, не собирает свою цепочку validation + derivation. Кеш вводить на границе потребителя после измерения».
- **Lint / gate:** ограничить прямые импорты низкоуровневого анализа из UI через `eslint/no-restricted-imports`; проверить разрешённые точки входа graph gate. Семантику проверяют существующие matrix/golden tests и invalid-export tests; время — отдельный benchmark, не тест числа вызовов внутренних функций.
- **Приёмка:** без изменения golden bytes и набора ошибок; invalid project не выдаёт files; rename/binding edit не вызывает ненужного пересчёта геометрии, если введён соответствующий кеш; benchmark до/после приложен.

### A06 — Архитектурные запреты неполны

- **Где:** `.oxlintrc.json:80,304,324,344,369,392`; `tsconfig.json` (DOM доступен всем слоям).
- **Доказательство:** установленный oxlint 1.85.0 пропустил три probes: domain → `localStorage`, storage → UI, components → `project-context`. Результат: 0 errors с 550 rules. См. E5.
- **Риск:** декларация чистоты/независимости в AGENTS не соответствует гарантии CI. Отсутствуют storage override и полный запрет доступа примитивов к application state. Regex путей проверяет написание, а не нормализованную цель импорта.
- **Исправление:** явная allowlist матрица импортов, нормализация import/re-export/dynamic import; pure-layer restrictions на DOM/storage/network/time APIs, включая `globalThis.*` и `node:*`. Примитивам разрешить только primitives и согласованные внешние UI-типы/API. Предлагаемая матрица — [gates.md](gates.md).
- **Ограничение агенту:** «Новый импорт должен соответствовать матрице слоёв. Обход через re-export, alias или альтернативный относительный путь запрещён. Исключение узкое, с причиной и negative fixture».
- **Lint / gate:** расширить существующие `eslint/no-restricted-imports`, `eslint/no-restricted-globals`, `eslint/no-restricted-properties`; сохранить `import/no-cycle`. Добавить проверку resolved graph и negative fixtures самого gate.
- **Приёмка:** E5 и эквивалентные обходы отклоняются; разрешённые импорты проходят; test-only Node APIs не запрещены вместе с production I/O.

### A07 — Значения по умолчанию и ограничения имеют нескольких владельцев

- **Где:** `src/domain/create-project.ts:6`, `src/catalog/shield-target.ts:7`; `src/domain/validate-bindings.ts:101`, `set-tap-dance-binding.ts:10`; `src/ui/bindings/slot-extras.tsx:17`; `src/domain/validate-project.ts:11`, `validate-shield-project.ts:35`.
- **Доказательство:** default board повторён в domain/catalog; pause 0–5000 независимо задана UI и domain; default 200 задан domain. Ограничения имени лежат в validators, тогда как maxLayerCount уже передаётся через catalog.
- **Риск:** изменение board/default/диапазона требует синхронных правок разных слоёв. Схема и validator уже разделяют проверку целого tappingTermMs: validator проверяет только диапазон, schema — целочисленность.
- **Исправление:** различать ZMK facts и продуктовые ограничения. Первые хранить в catalog, вторые — в domain policy. Передавать policy в domain по существующему образцу BindingsCatalog; UI использует те же значения/чистый predicate. Default board передавать в фабрику из композиции. Frozen migrations сохраняют исторические defaults.
- **Ограничение агенту:** «Не копировать domain validation в компонент. Политика отклонения UI-ввода может отличаться от импорта, но predicate/limits общие. Не выдавать продуктовый лимит 5000 за ограничение upstream без источника».
- **Lint / gate:** узкие ограничения новых board/version literals вне catalog и frozen migrations; catalog contract tests, boundary tests для integer/range/default. Глобальный `no-magic-numbers` не вводить: SVG-геометрия создаст шум.
- **Приёмка:** смена policy меняет UI и validator согласованно; fractional/NaN/Infinity обрабатываются по явному контракту; старые JSON и golden bytes сохранены.

### A08 — Черновик binding допускает невозможные комбинации

- **Где:** `src/ui/bindings/binding-slots.ts:32`; `pick-result.ts:6,34`; `pick-value.ts`; `draft-state.ts`.
- **Доказательство:** BindingDraft имеет общий набор optional fields: `behaviorId: 'kp'` можно совместить с `profile`, `layerId`, `outCommand`. PickInput независимо комбинирует source, slot и pick. Согласованность восстанавливается множеством условий и `throwUnfitPick`.
- **Риск:** добавление поведения увеличивает число сочетаний, которые нужно помнить во всех formatter/picker функциях. Это структурный риск, не доказанное падение UI.
- **Исправление:** discriminated union черновиков по behaviorId с только допустимыми полями; явные переходы UI state. Связать допустимый pick со slot в типах или в одной функции проверки/перехода. Полные Binding преобразовывать domain-операциями; навигацию по слотам оставить в UI. Не создавать универсальный framework редакторов.
- **Ограничение агенту:** «Взаимоисключающие состояния описывать union, не набором optional fields. Новый behavior добавляется с полной таблицей допустимых переходов и exhaustive switch».
- **Lint / gate:** сохранить exhaustive switch checks; custom AST-правило только для именованных state types может запрещать возврат к общей optional-модели. Главная защита — TypeScript и реальные UI tests draft→commit/cancel/layer switch; shape tests, дублирующие компилятор, не нужны.
- **Приёмка:** несовместимые поля не компилируются; существующие picker tests проходят; stale selection/удалённый layer безопасно сбрасывают draft или показывают проблему.

### A09 — Нет проверки главного контракта: сборки прошивки

- **Где:** `.github/workflows/ci.yml`; `Makefile`; `src/generators/*.test.ts`; roadmap 023 build-verification.
- **Доказательство:** CI выполняет JS checks/build и Docker image build. Golden сравнивает строки; команды компиляции полученного ZMK config отсутствуют.
- **Риск:** одинаково ошибочные generator и golden проходят CI. Это пробел доказательства buildability, а не утверждение, что текущая прошивка не собирается.
- **Исправление:** реализовать уже предусмотренный roadmap 023 раньше дальнейшего расширения генераторов; не создавать конкурирующую feature. `make zmk-build` генерирует фактический repo output, собирает на закреплённом ZMK/Zephyr/toolchain и сохраняет logs/artifacts.
- **Ограничение агенту:** «Golden нельзя обновлять как доказательство корректности синтаксиса. Изменение генератора/board catalog требует независимой проверки сборки; upstream fixtures не редактировать».
- **Lint / gate:** lint сборку ZMK не проверяет. Отдельный обязательный CI job для затронутых generator/catalog/domain-output/storage-export/fixtures/build-check файлов; smoke по всем четырём текущим controller targets, обе полярности и используемые custom behaviors. Документировать состав матрицы, не дублировать все комбинации без причины.
- **Приёмка:** сборка файлов, созданных текущим generator, без ручных правок; намеренно неправильный connector/DT property ломает job. Pin среды и зависимостей входит в cache key.

### A10 — Покрытие агрегатов не гарантирует ключевые сценарии

- **Где:** `vite.config.ts`, `src/ui/app-*.test.ts`, `scripts/check-test-mutations.py`.
- **Доказательство:** make check зелёный при 88.42% lines / 81.43% branches; `issues-panel.tsx` — 0% lines, `pointer-create.ts` — 38.09%, `pointer-select.ts` — 62.79%, `project-messages.tsx` — 52.38%. E1–E4 не были пойманы. Mutation script не включён в CI.
- **Риск:** существующие сильные domain/ZIP/lifecycle tests не закрывают часть восстановления данных, панели проблем и pointer-взаимодействий.
- **Исправление:** добавить сценарии открытия/закрытия Problems с возвратом фокуса, failed autosave/backup recovery, pointer create/cancel/bend no-op, import races/complexity. Расширить seeded mutations этими регрессиями; запускать отдельно, последовательно, в изолированном CI checkout.
- **Ограничение агенту:** «Новый тест обязан падать на конкретной бизнес-регрессии. Не мокать React/domain/generator; не повышать процент тестами внутренних вызовов. Floors не понижать».
- **Lint / gate:** оставить Vitest rules; добавить AST-запрет React hook mocks и production `.skip/.only` в тестовой политике, если они ещё не покрыты установленными правилами. Coverage — ratchet, mutation/behavior tests — доказательство чувствительности. Не требовать 100% каждого файла.
- **Приёмка:** перечисленные сценарии выполняются через реальные controls/provider; seeds обнаруживаются; тесты восстановления проверяют saved JSON и неизменность текущих данных.

### A11 — Теряется причина ошибки сохранения

- **Где:** `src/storage/project-storage.ts:135`; `src/storage/serialize-project.ts:7`; `src/ui/shell/project-bar.tsx`, `SAVE_STATUS_TEXT`.
- **Доказательство:** serializeProject возвращает schema path/message, но saveProject превращает любую такую ошибку в `'unavailable'`. UI пишет «browser storage is blocked», хотя storage не вызывался. A01 достигает именно этой ветки.
- **Последствие:** пользователь и разработчик получают неверную причину; внутренний дефект данных выглядит как проблема браузера.
- **Исправление:** отдельный discriminated `SaveError` для invalid-project, storage-unavailable, quota-exceeded; сохранить безопасные path/message. UI показывает различимые recovery actions. Не включать полный проект в сообщение/лог.
- **Ограничение агенту:** «На границе слоя не заменять структурную ошибку причиной другого класса. Каждый error kind имеет проверяемое сообщение и действие восстановления».
- **Lint / gate:** штатный lint не определит корректность error mapping; exhaustive handling union + boundary/UI tests. Blanket запрет catch или строковых ошибок не нужен.
- **Приёмка:** schema failure не вызывает storage write и не обещает устранение разблокировкой браузера; quota/unavailable сохраняют текущие сообщения; в памяти остаётся проект.

### A12 — Правила разработки дрейфуют относительно реализации

- **Где:** `docs/guidelines/frontend/react.md:61`, `src/ui/canvas/work-surface.tsx`; `docs/guidelines/code-quality/control-flow.md`, `.oxlintrc.json`; `AGENTS.md §3.1`.
- **Доказательство:** таблица требует точного списка useEffect, но не содержит work-surface.tsx. Control-flow перечисляет `require-await` как enforced, конфиг явно выключает `eslint/require-await`. Схема зависимостей одной стрелкой не описывает реально разрешённые UI→domain/catalog и generators→catalog.
- **Риск:** агент получает неоднозначные ограничения; формальная проверка текста не подтверждает фактическое правило.
- **Исправление:** заменить упрощённую стрелку явной матрицей; синхронизировать effect registry и статус правил. Каждый запрет помечать lint / test / review; исключения документировать рядом с правилом. Не копировать нормативный текст в новые skills.
- **Ограничение агенту:** «Изменение enforcement или effect требует обновления его источника истины. Не писать “enforced”, если нет выполняемой проверки».
- **Lint / gate:** source/registry consistency script для effects; fixtures для enforcement из A06; проверка ссылок и обязательных разделов правил. Семантические review-правила честно оставлять review.
- **Приёмка:** registry совпадает с фактическими production useEffect; документация и lint agreement проверяются; существующие agent mirrors остаются синхронными.

## 3. Порядок и определение готовности

Порядок реализации и зависимости: [tasks.md](tasks.md). Проект будущих gates и инструкции агентам: [gates.md](gates.md). Проверки и воспроизведение: [research.md](research.md).

Для каждого пункта: failing behavioral/negative-gate test → минимальное исправление → зелёный тест → `make check`.
Не менять формат Project без migration; не вводить новые runtime dependencies, backend или архитектурные слои ради этого аудита.
Каждый реализованный gate сам имеет positive/negative fixtures; снижение покрытия и широкие lint-disable не считаются исправлением.

## 4. Сценарии реализации

Исходные результаты выше — снимок аудита. Пользовательский запрос 2026-10-12 разрешает реализацию программы исправлений.

| Story | Priority | Сценарий | Независимая приёмка | Requirements |
|---|---|---|---|---|
| US1 | P1 | Открыть, изменить и сохранить проект без повреждения/устаревшей замены | ID round trip, deferred Open/New/edit, budgets и historical fixtures | A01–A03 |
| US2 | P1 | Разработчик получает диагностику нарушения границ до merge | Positive/negative resolved import и purity fixtures | A06 |
| US3 | P2 | Пустые действия сохраняют redo; ошибка сохранения объясняет причину | no-op identity/history/autosave и error-kind UI tests | A04, A11 |
| US4 | P2 | Одинаковые limits и analysis используются во всех consumers | policy boundaries, benchmark, invalid export, неизменный golden | A05, A07 |
| US5 | P2 | Редактировать binding и восстанавливать проект через безопасные transitions | picker/layer/selection и Problems/recovery/pointer scenarios, mutation seeds | A08, A10 |
| US6 | P1 | Экспорт собирается pinned upstream ZMK | Feature 023 actual output smoke и intentional failure | A09 |
| US7 | P3 | Инструкции отражают выполняемые проверки | effect registry/enforcement fixtures и agent sync | A12 |

US6 имеет собственный номер 023 по roadmap. Полное завершение 024 требует её evidence; отсутствие этой feature не считается выполнением A09.
