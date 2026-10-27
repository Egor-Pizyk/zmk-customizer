# 040 — proposal, protection and UI contracts

## Pure operation boundary

Публичные `createWiringProposal`, `regenerateWiring`, `prettifyWiring`, `applyWiringProposal` принадлежат domain/wiring/editing; точные aliases регистрируются только если действительно создаётся новый module owner. Domain получает typed board facts аргументом, не импортирует catalog. Нет I/O, async, clocks/random или JointJS objects.

Regenerate: source Project + explicit target topology/style/settings/scope → полный candidate или atomic failure. Неизвестные hardware assignments — видимое предложение, не обнаруженные факты. Preview содержит изменения target matrix/GPIO/diodes. Переход на новый direct style показывает замену historical input1/GND2 на input2/GND1, removal incompatible diodes только явно и без обхода замков.

Prettify: source + geometry settings/scope → только геометрический candidate. Не вызывает autoAssignCells, terminal allocation, diode conversion или missing-link completion. На пустой схеме/no-op возвращает original reference, summary no-work. Все unrelated Project fields должны совпасть, routing settings могут меняться только как явно показанное применяемое предпочтение, не как скрытый side effect no-op.

## Electrical equivalence

Проверка независима от route construction. Сохраняются stable IDs keys/wires/terminals/encoders, все endpoint identities и ordered attachment sites на wire, resolved contacts из pool, junction references и adjacency между conductor spans, свободные и изолированные участки, deliberate crossing connectivity. Координаты movable internal junction sites могут меняться согласованно, но их branch topology и участники — нет. Free endpoints fixed. Insulation refs описывают только существующие геометрические события и не являются обязательными узлами electrical relation graph. Если изолированное пересечение исчезло, удалить его CrossingRef; если сохранилось — переназначить на соответствующее новое событие/ordinal; новые непреднамеренные crossings явно изолировать. Старый ordinal не переносится по индексу. Во всех трёх случаях проверить unchanged separation/participants/branch topology независимо от количества CrossingRef. Намеренный connected crossing сохраняется как электрический branch/contact даже при новом расположении; замок запрещает изменение его непосредственного контакта, но не требует хранить уже несуществующий insulated event.

Сравнить canonical labelled relation graph, не количество nets и не только connected key pin partition. Terminal meaning включает half, kind, boardPin и board identity. Отдельно сравнить derived scan cells/order, GPIO order, KeyDiode flow, keys/layers/firmware и остальные nongeometry fields. Экспортируемый проект после Prettify обязан иметь byte-identical generated file list/content; для неэкспортируемого сохранить circuit relations и electrical issue meaning (индексы geometrical diagnostics могут измениться, электрическая ошибка не должна исчезнуть).

## Protection boundary

`validateWireProtection(base,candidate)` — pure issues; public query не возвращает net engine. Сохранять locked ID, fields, effective drawn conductor и immediate attachments, resolved pool data и attached pin/terminal meaning. Непосредственный key pin связан либо endpoint, либо explicit contact; транзитивные участники net не являются защищёнными клавишами.

Таблица отказов обязательна: wire bends/end/delete/section/shared span, key move/rotate/resize/delete, encoder A/COM/B and pushKey edits, terminal GPIO/half/kind/delete, board replacement, diode swap/transfer, crossing connect/isolate, regeneration, clipboard fragment и layout replacement. При group отказе ни один участник не меняется. Dedicated unlock-only — отдельная команда; composite candidate не может снять lock и удалить wire одновременно. Undo/Redo и подтверждённый whole-project replace остаются отдельными history/file contracts.

## Deterministic geometry

Локальные pin1 lower/pin2 upper фиксированы до key rotation. Row bus Y — midpoint между медианами текущего и строго верхнего logical row; при отсутствии верхнего — half mean positive distinct-height spacing, иначе fallback. Для центров Y=0,1,3: row bus Y=-0.75,0.5,2 соответственно. Для единственного центра Y=2 и fallback1: bus Y=1.5. Для двух row centers одной высоты preferred Y совпадёт, но nets не объединяются; последующая routing conflict policy обязательна.

Колонки: same pin X → straight; иначе outward extreme pin X ± offset. Для левой/unibody extreme=min, правой=max. Candidate shifts идут наружу с шагом offset. Detours axis-aligned, clearance сохраняется для различных параллельных проводников кроме намеренных branch contacts. Пересечение чужой net допускается только изолированное. Route score из plan сравнивается в half-normalized frame и стабильно разрешает ties; ни array iteration order library cells, ни timestamps не участвуют.

Search bounded: до 64 outward shifts и до128 detours/span, failure объясняет ограниченный поиск и предлагает изменить параметры/область или снять конкретный lock. Не гарантируется globally shortest route. Нет возврата повреждённого partial candidate.

## UI and lifecycle

Три radio choices: existing matrix, matrix buses, direct separate. Matrix choices сохраняют одну topology. Область all/half/selection явно показана; при selection из другой ревизии — отказ/reselect. Net/row/col highlighting и missing pins — derived diagnostic overlay с текстовым списком, никогда fake wires.

Глобальные кнопки pin swap/diode side независимы на уровне логических состояний: swap сохраняет diodeSide, transfer сохраняет rowPin, обе сохраняют diodeDirection. KeyDiode.pin вычисляется из rowPin/diodeSide и может поменяться при swap; current/proposed физический pin и полярность отражены в preview. Кнопки показывают current/proposed, «Вся клавиатура»; в direct disabled с причиной. Для legacy mixed state кнопка требует выбрать target uniform state. В preview доступны только выбор/инспекция; запрет canvas/Parts edit не отменяет preview молча. Статусы/calculation, summary, warning/error lists и Apply/Cancel находятся в существующем Wiring editor, footer вне вложенной прокрутки. Stale остаётся видимым с Recalculate; no-work с объяснением и без history.

Provider revision+base+request проверяются до принятия Worker result и внутри Apply. Любое Project change invalidates, включая Undo/Redo ABA и accepted Open; preferences/camera не invalidates. Worker replies различаются как changed/no-change/refused; no-change не несёт candidate, UI сохраняет original main-thread Project и не вызывает commit/save, settings-only передаётся как changed. Ссылки между разными threads не сравниваются для no-op. Cancel/поздний ответ/двойной Apply не создают history/autosave. Worker не публикует промежуточные Projects. Его код eagerly встроен в первоначальный bundle через Vite `?worker&inline`, без lazy/external worker chunks; первый запуск и повтор после Cancel работают offline без прогрева или HTTP cache. Production nginx CSP получает только worker-src blob:, остальные script/connect ограничения сохраняются; ошибки Worker не включают synchronous fallback.

Замки: wire icon и list button, accessible name с wire ID/описанием, aria-pressed, visible locked/unlocked state, target>=24px. Отказ ведёт к защищающему wire и явному unlock. Работа только с клавиатурой/таблицей полноценна; после Cancel фокус opener, после failed Apply ошибка доступна без потери фокуса. Light/dark, reduced motion, 390/1024/1280 widths и 200% zoom сохраняют действия; нет color-only информации.

## Owning amendments before implementation

Не менять spec038. Добавить актуальные feature040 extensions в 003 wire schema/UI, 008 diode contract, 012 layout lock refusal и group policy, 013/033 wiring interaction names/preview и direct pin convention; historical behavior scope указывать по версии. 002 file contract расширить до текущей schema, сохранив frozen versions. Обновить domain-model, architecture explicit proposal Worker entry (без открытия engine UI), folder map только при новом owner, guidelines для protection refusal и local async calculation, resource notes и agent creation package. Onboarding учит новым flow и targets, а не исчезнувшему Rebuild-only контракту. Все amendments — в той же фиче, до affected production edits.
