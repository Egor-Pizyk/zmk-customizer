# 040 — журнал спецификации

## Scope and decisions — 2026-10-27

Только specify: отдельная спецификация, checklist, index/roadmap. Реализация, plan и tasks не создавались. Применён навык speckit-specify; before/after hooks отсутствуют: `.specify/extensions.yml` не существует.

База: `9c461b4cb39ff353dd7f53ecce8837f068cf3676`, ветка `feature/038-jointjs-schematic-editor`, чистый working tree. Проверены открытые PR #29, #31, #34 и выполнен fetch origin. По явному запросу пользователя создана ветка от текущей, `git merge origin/main` сообщил Already up to date. Это явная зависимость от незавершённой 038; сначала интеграция 038, затем реализация/поставка 040. PR со стеком изменений не создавался; перед поставкой требуется согласовать основание с main после 038.

Resolver dry-run без номера предложил 039 по локальным каталогам. Проверка дерева `origin/feature/039-focused-local-checks:specs` обнаружила уже существующую 039. Повторный вызов актуального `.specify/scripts/bash/create-new-feature.sh --dry-run --number 40 --short-name symmetric-wiring` подтвердил 040, затем тот же resolver создал каталог и selection. Не перенумеровывались существующие specs и не копировались артефакты другой ветки.

Изучены текущие `get-wiring-connections`, `create-wiring-terminals`, `route-wiring`, `derive-wiring` и проверенные docs/zmk/kscan.md. Matrix bus — стиль существующей topology; direct — один GPIO/key и GND. Электрические/геометрические решения Q1–Q3 оставлены для clarify по запросу пользователя.

## Checks and limits

Выполнен обзор требований по исходному запросу: 21 FR, 5 US, 17 AC, 5 SC, три clarification markers. Проверены относительные Markdown-ссылки новых файлов (все цели существуют), ровно три clarification markers и 21 FR; `git diff --check` прошёл. Resolver повторно подтвердил selection 040. Это prose-only изменение: продуктовые тесты, firmware build и UI-review не запускались и не заявлены выполненными. Onboarding-update обязателен при реализации по FR-021; сейчас пользовательский интерфейс не меняется.

Draft готов к speckit-clarify, не к plan/implement. [Checklist](checklists/requirements.md) фиксирует незакрытые пункты. Реализация и поведение не объявлены завершёнными.

## Clarify — 2026-10-27, ответ 1

Применён speckit-clarify; resolver paths-only подтвердил 040. Пользователь выбрал A для direct: верхний локальный пин → отдельный GPIO, нижний → отдельный маршрут к GND-терминалу своего контроллера/половины, объединение только у терминала, без общей шины и автоматических межконтроллерных связей. Обновлены US1, FR-003, AC-07 и Clarifications. Остались геометрия Q2 и область переключателей Q3; plan по-прежнему заблокирован. Checklist пока сохраняет прежние состояния: частичное уточнение не закрывает его незавершённые пункты.

## Clarify — 2026-10-27, ответ 2

Пользователь выбрал A: оба матричных переключателя применяются ко всей клавиатуре атомарно; любой конфликт на любой половине отклоняет операцию целиком. Области генерации/Prettify независимы. Обновлены US4, FR-009/016, AC-05 и Clarifications. Осталась геометрия Q2; plan пока заблокирован. `git diff --check` проверяет изменения документации; продуктовые проверки не запускались.

## Clarify — 2026-10-27, ответ 3

Пользователь выбрал A для геометрических рядов: одна шина на логическую строку каждой половины; медиана экранных высот центров клавиш, ближайший строго верхний центр, экранное направление вверх. Для чётного числа значений медиана — среднее центральной пары. Совпавшие высоты разных строк не объединяют цепи. Обновлены FR-005, AC-04, Clarifications и остаток Q2. Остались численные параметры и правила обходов; они уточняются отдельно, в пределах пяти вопросов текущей сессии.

## Clarify — 2026-10-27, ответ 4

Пользователь выбрал A: fallback 1u, отступ 0,15u, зазор 0,10u; настраиваемые сохранённые значения. Средний интервал считается между соседними различающимися высотами рядов половины; при отсутствии интервалов используется fallback. Шина верхнего ряда выше на половину интервала; колоночное смещение наружу, зеркально справа. Обновлены FR-005/006/017, AC-04 и Clarifications. Остался порядок обходов.

## Clarify — 2026-10-27, завершение

Пятый ответ A принят: наружные сдвиги шины с шагом отступа, затем прямоугольные обходы; без уменьшения зазора и изменения замков/электрического смысла; предупреждение о нарушении симметрии, атомарный отказ при отсутствии допустимого результата. Обновлены FR-007, AC-02, Clarifications, статус и assumptions. Убраны устаревшие блокирующие Q1–Q3; обновлены index/roadmap. Все пять ответов интегрированы, по одной записи в Clarifications на ответ.

Checklist: 9/13 → 12/13. Новые passing: отсутствие clarification markers, однозначность требований, готовность к plan. Регрессий нет. Единственный незакрытый пункт — проверка поведения на продукте: реализация не начата. По правилу speckit-clarify в checklist изменены только состояния checkbox; поясняющие формулировки про прежние Q1–Q3 остаются историческим текстом первоначальной проверки, актуальный статус описан здесь и в spec.

Coverage: scope/behavior, domain/data, UX, nonfunctional attributes, dependencies, edge/failure cases, constraints, terminology и completion signals — Clear/Resolved. Misc placeholders — Resolved, markers не осталось. Deferred только детализация реализации: границы поиска, разрешение равнозначных кандидатов, эталон производительности и независимые fixtures. Они входят в plan; повторный clarify по текущим решениям не требуется. Обещание абсолютного поиска всех возможных маршрутов не вводится.

Проверены локальные ссылки новых артефактов, отсутствие NEEDS CLARIFICATION, пять записей ответов, сохранение 21 FR/17 AC/5 SC и `git diff --check`. Product tests, firmware build и UI-review не запускались для prose-only этапа. Ветка остаётся зависимой от незавершённой 038 по первоначальному явному запросу; текущий этап не включает commit/push/PR со стеком чужих изменений.

## Plan — 2026-10-27

Применён speckit-plan; setup-plan resolver подтвердил 040 и создал активный plan-template. Before/after hooks отсутствуют. Прочитаны task-routed architecture/folder/tooling/domain/frontend/code-quality rules и relevant existing file/wiring/038 contracts. Read-only research agent изучил lock mutation/storage seams, без edits; результаты сведены в research, отдельного журнала агента нет.

Созданы plan.md, research.md, data-model.md, contracts/wiring.md и quickstart.md. Код/зависимости/миграции не менялись. Решены технические направления: complete-candidate lock guard, точная relation equivalence, bounded deterministic routing, transient UI Worker и существующий 038 revision getter, условная schema14 с frozen v13 validation. Пять пользовательских ответов сохранены; spec040 не подменяет историю/ограничения 038.

Обнаруженный resource mismatch явно включён в plan: текущие wires600/segments3000 не принимают SC-004. Целевое wires2000/segments16000 требует measured stress gate, без изменения 5MiB и GPIO facts. Большой допустимый preview проверяется whole-schematic Prettify и scoped8×8 regeneration в окружении500/2000; whole-capacity refusal не считается performance success. Нет утверждений о выполненных измерениях.

Проверка PR list: #34/038 и #29 открыты; #31 отсутствует в OPEN list (merged status отдельно не проверялся). Dependency implementation gate остаётся: сначала интеграция038, затем согласование базы/schema и tasks/analyze/pre-implementation review. Обновления owning rules о protected-edit refusal/local async computation и resource-limit evidence включены как явные работы до production edits, не как уже сделанные исключения. Новых runtime dependencies нет.

Plan stage готов к speckit-tasks. Продуктовые тесты, browser UI review, firmware builds и performance runs для prose-only планирования не запускались. Delivery/commit/push/PR на этом этапе не выполнялись; ветка сохраняет первоначальное explicit dependency exception.

Plan artifact checks: все локальные Markdown targets новых файлов существуют; trailing whitespace нет; все девять секций активного plan-template заполнены; `git diff --check` прошёл. tasks.md отсутствует намеренно: этот этап заканчивается дизайном.

## Tasks — 2026-10-27

Применён speckit-tasks; setup-tasks resolver подтвердил каталог040 и активный override tasks-template, before/after hooks отсутствуют. Сгенерированы69 незавершённых задач: Setup4, Foundation9, US3=13, US5=6, US1=12, US2=7, US4=5, completion13. Порядок P1-story фаз определён реальными зависимостями safety→preview→generation→Prettify, затем P2 переключатели. Шесть задач отмечены P как независимые после prerequisites; safe examples не являются запросом запускать агентов.

В tasks.md создана единственная подробная requirement→task→check→evidence mapping: все21 FR,17 AC и5 SC; evidence первоначально «Не выполнено». MVP сохранён как внутренний safety+matrix+Prettify milestone, все direct/scopes/inversion/irregular/scale этапы остаются обязательны. Tasks включают red-before-production, old files/schema checkpoint, full-candidate protection, revision ABA, byte-identical export, real Worker/browser/keyboard/offline, sensitivity, firmware и performance gates. Production work не начинался.

Уточнены actual existing owners: tests/tooling/check-architecture.test.mjs, scripts/check-e2e-mutations.mjs, scripts/mutation-runner.mjs, onboarding-macropad browser journey; storage project-budget является реэкспортом domain limit. Исправлены устаревшие пояснения checklist после завершённого clarify, checkbox states остаются12/13 (product verification ещё не выполнена). Index/roadmap и ссылка plan→tasks обновлены.

Проверены69 последовательных уникальных Task IDs, task paths, корректность ссылок на задачи, наличие всех FR/SC в mapping, локальные Markdown targets и whitespace. Продуктовые тесты, builds, firmware, UI review и performance runs на этом prose-only этапе не запускались. Следующий этап speckit-analyze; implementation gate T001/T002 ещё открыт. Ни commit/push/PR, ни изменения src/tests/scripts не выполнялись.

Tasks stage: `git diff --check` прошёл; новые Markdown-файлы отдельно проверены на trailing whitespace, поскольку они пока untracked. Все69 задач остаются unchecked.

## Remediation после analyze — 2026-10-27

Пользователь явно разрешил исправить шесть замечаний и повторить анализ. Правки выполнены отдельным documentation pass до нового read-only analyze; src/tests/scripts/infra не менялись. Исходные IDs замечаний сохранены:

- I1: US4/FR-016/AC-05, plan/model/contract и T052/T053 теперь сохраняют логическую diodeSide при pin swap, вычисляют физический KeyDiode.pin из rowPin/diodeSide и сохраняют diodeDirection. Перенос диодов не меняет rowPin. Это уточнение независимости пользовательских переключателей, не новый аппаратный факт.
- I2: SC-004/AC-16 явно задают whole Prettify500/2000, selected8×8 generation в полном окружении и whole generation крупнейшего electrically-valid preset; все допустимые previews измеряются20 samples/p95<=3s. Full500 GPIO refusal не засчитывается вместо preview. Plan/quickstart/tasks и coverage отражают тот же scope.
- U1: inline Worker eagerly входит в initially loaded bundle, без lazy/external chunks. Offline first-use и restart после Cancel не полагаются на прогрев/HTTP cache. Проверены Vite official inline mode и текущая infra/nginx.conf CSP; T029 предусматривает failing asset/CSP contract и только worker-src blob: до активации, сохраняя script-src self/connect-src none. Product build/browser evidence пока отсутствует.
- U2: typed transport changed/no-change/refused; no-change не передаёт candidate и сохраняет original main-thread Project без commit/autosave, settings-only = changed. Domain-local no-op reference не сравнивается с клоном другого thread. Real Worker/provider assertions добавлены к T028/T032 и guide.
- I3: T041/T042 теперь полностью завершают matrix styles без direct; новый direct dispatch/UI интегрирует T040 после T041/T042. Stable Task IDs сохранены, forward prerequisite явно указан, циклической зависимости не вводится. Matrix MVP включает замкнутый набор T001–T038,T041,T042,T045–T051, не T039/T040/T044.
- U3: disappeared insulated geometry event удаляет лишний CrossingRef, retained remaps, new gets insulation; exact electrical separation и intentional connected branch сохраняются независимо от числа геометрических refs. Обновлены FR-011, contract, plan, T045–T048 и guide.

69 task IDs и все обязательные возможности сохранены; ни одна production task не отмечена выполненной. Следующий проход speckit-analyze выполняется read-only после проверки ссылок/структуры/зависимостей. Запись о результате повторного анализа не добавляется автоматически в ходе read-only skill; результат сообщается пользователю отдельно.

Перед повторным read-only анализом: `git diff --check`, локальные ссылки/whitespace, 69 уникальных Task IDs и покрытие26/26 прошли; dependency graph ацикличен, matrix MVP dependency closure не включает T039/T040/T044. Performance fixtures требуют nonzero geometry diff, no-change не подменяет нагрузку. `gh pr view 34` подтверждает OPEN/mergedAt=null: execution gate интеграции038 остаётся невыполненным. Все правки только в артефактах040; product checks не запускались.
