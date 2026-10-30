# 040 — validation protocol (после реализации)

Этот guide не является отчётом об уже выполненных проверках. Реальные receipts и limits записываются только в [verification.md](verification.md); requirement/task coverage будет в tasks.md.

## Prerequisites and fixtures

Сначала принять 038 и согласовать текущую ветку с main; проверить schema version и resolver. Пройти tasks/analyze, owning-rule amendments и migration tests до поведения UI. Использовать Docker/Node24 и команды из docs/commands.md; обычные пользовательские браузерные профили не использовать.

Подготовить hand-authored fixtures в `tests/fixtures/schematic/040-*`: regular3×3, stagger+30°/90°+thumb+nonstandard size, mirrored/asymmetric split, one-row/one-col/holes/equal row heights, incomplete/free/junction/insulated/pooled contacts, mixed locks и direct-capacity. Historical project fixtures не редактировать для оправдания migration. Expected coordinates и electrical graph hand-authored, не generated проверяемой функцией. Generator expected files связаны с pinned upstream provenance.

## Local checks

После tests-first red/green и завершения production changes staged explicit paths, затем:

```sh
npm run check:changed
```

Сохранять exact tree/base receipt и log paths. Full suites выполняет CI по docs/commands.md; не запускать их повторно без изменения/ошибки. Generator/output contracts требуют локальной pinned firmware проверки:

```sh
make zmk-build
```

Сначала сверить актуальные selectors и prerequisites в docs/commands.md. Нужны matrix/direct, split и оба направления диодов; факт source/golden проверки не заменяет firmware result. Browser checks выбирать через changed-check runner, targeted engine cases определяет plan. Controlled sensitivity run выполнять отдельно, восстановить исходные файлы и записать expected assertion failure, не compiler exception.

## End-to-end journeys

1. Открыть fixture через реальный Open. Сохранить исходный JSON/ZIP. Выбрать style/scope/settings; Regenerate показывает candidate и summary, сохранённый JSON пока неизменен. Cancel не создаёт Undo; повторный запуск+Apply создаёт один. Undo/Redo/Save/Open дают точные ожидаемые проекты.
2. Incomplete fixture: Prettify меняет только геометрию; недостающие связи подсвечены отдельно, free ends и intentional sites сохранены. Отдельные случаи: исчезнувшее insulated crossing удаляет ненужный CrossingRef, сохранившееся меняет ordinal с корректным remap, новое получает insulation; separation неизменна, а connected crossing не теряет электрический branch. После Apply сравнить фактический JSON/electrical relations. Для валидного fixture все generated path/content и ZIP configuration bytes совпадают; повторный Prettify no-work.
3. Lock через canvas icon и через Parts. Попробовать pointer+numeric key transform, wire corner/end edit, section/mixed delete, GPIO/controller/diode edit, regenerate. Защищённое соединение не меняется, смешанная группа целиком отклонена, Find wire выбирает защитника. Сосед в общей net свободен. Явный unlock — отдельный Undoable edit; после него операция разрешена.
4. Все четыре pin/diode-side сочетания × два flow направления на matrix. Pin swap сохраняет логическую diodeSide и diodeDirection, но физический pin диода меняется по rowPin/oppositePin; diode transfer сохраняет rowPin. Проверить соответствующий физический pin и cathode после каждого действия, не только label переключателя. State переключателей глобальный даже при selection одной половины. Конфликт другой половины отклоняет весь Apply. Direct показывает их неприменимость; pin2 individual input/pin1 separate GND с объединением только на своём терминале. Capacity+1/ref reserved GPIO — ясный отказ без damaged result.
5. Изменить Project при ready/in-flight preview, затем Undo→Redo и вернуть старый объект. Apply остаётся stale, Recalculate создаёт новый token. Cancel while busy; late Worker result не возвращает кандидат. Двойной Apply — один commit. На реально уже оптимизированном проекте Worker возвращает no-change без candidate; main-thread Project reference и Undo depth остаются прежними, autosave не вызывается. Изменение только сохраняемых настроек возвращает changed и один шаг Apply, даже если геометрия совпала. Панель/темы/zoom не меняют electrical Project.
6. Только клавиатурой пройти equivalent list flow. Проверить focus return/error reveal, reader names и single announcements, 24px targets, light/dark, reduced motion, 390/1024/1280 widths и 200% zoom. Для screen-reader speech отдельная manual запись, не claim по DOM.
7. На production nginx с реальной CSP после первой загрузки приложения отключить сеть до первой операции/создания Worker (без прогрева и HTTP cache), проверить первый inline Worker, calculation/Cancel, его повторное создание offline и Apply. Отдельно reload при доступном app shell проверяет сохранённые lock/settings; offline reload всей страницы без service worker не является новым требованием. Никаких Worker asset/importScripts/remote requests после initial load; script-src self/connect-src none сохраняются, разрешён только worker-src blob:.

## Performance and resource gate

SC-004 не выполняется отказом по старому 600-wire limit. Сначала baseline на текущем maximum и malformed/near-budget fixtures. После bounded spatial routing перейти к wires2000/segments16000; сохранить bytes5MiB, historical checks и no-truncation. Если замеры не проходят, оптимизировать или оставить execution blocker, не снижать критерий.

Зафиксировать host Apple M1 Pro или быстрее, точные CPU/RAM/OS, Docker image digest, Chromium version, production revision, 4CPU/8GiB container, один Playwright worker. Fixture: 500 keys, 2000 wires, 200 insulated crossing refs, 200 locked wires; actual scene/JSON должны подтверждать эти числа. Фикстура под текущим byte/segment budget и даёт допустимые route candidates. Маршруты обрабатываемой области намеренно неоптимальны; успешный candidate должен иметь ненулевые геометрические изменения, проверенные независимо от router. No-change не засчитывается вместо этих performance samples.

- Whole-schematic Prettify обрабатывает все существующие проводники, включая намеренно незавершённые, без electrical completion.
- Generation обрабатывает selected8×8 matrix area с 16 реальными доступными GPIO в полном окружении 500/2000; out-of-scope equality проверяется. Входные 2000 включают заменяемые провода; результат не превышает лимит.
- Отдельно whole-schematic generation крупнейшего допустимого preset с теми же20 samples/p95<=3s и отказ whole500 по реальной capacity. Отказ не заменяет два первых stress кейса. Direct испытывается в реальной capacity, без выдуманного board.

Один прогрев, затем 20 запусков каждой операции на неизменённом входе. `performance` marks в test instrumentation, не timestamps в Project. End-to-end latency включает Worker startup/clone, routing, invariant checks, summary и scene ready. Nearest-rank p95 (19-е из 20 отсортированных значений) <=3s. Apply/Undo/Redo each <=500ms. Cancel от реального click/keyboard до idle <=200ms; main thread не выполняет скрытый секундный fallback. Сохранить все значения, не только среднее/удачный запуск. Дополнительно собрать heap/history/mount lifecycle profiles для диагностики; измерение callback timing не заявлять как FPS/actual paint latency.

Повторить одинаковый input/settings для deterministic geometry и mirror relation, второй Prettify на candidate обязан дать zero-change. Пересчёт после Save/Open идентичен. Убедиться в responsiveness и отсутствии Worker/listener leaks после повторных Cancel/editor mount циклов.

## Final acceptance

Пройти AC-01–17, requirement-linked tests и rendered UI-review; обновить onboarding и фактические evidence limits. Один feature PR to main после integration038, draft при невыполненной обязательной manual acceptance. Не auto-merge и не ждать CI по Git flow.
