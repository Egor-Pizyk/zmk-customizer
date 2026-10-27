# 040 — persisted and transient contracts

## Project v14 (conditional on integrated v13 base)

`Project` остаётся readonly plain JSON. В `src/domain/types.ts` добавить optional `routing: RoutingSettings`, `Wire.locked?: true`. Отсутствие locked означает unlocked; ложное значение не сохраняется. Типы описать отдельными domain routing types при росте types.ts, без нового универсального framework.

`RoutingSettings`:

| Field | Shape / purpose |
| --- | --- |
| matrixStyle | `existing` / `symmetric-bus`; direct использует собственный separate style, не третью матричную topology |
| offsetU | конечное положительное число, default 0.15 |
| clearanceU | конечное положительное число, default 0.10 |
| fallbackRowIntervalU | конечное положительное число, default 1 |
| mirrorAxisXU | optional конечная X в existing coordinate bounds; отсутствие — derived midpoint между bounds половин |
| preferredScope | `all` / `half` / `selection`; selection IDs остаются transient |
| preferredHalf | optional `left` / `right`, только для half scope |
| rowPin | optional `1` / `2`, желаемое единое назначение для новой генерации; default1 на пустой схеме |
| diodeSide | optional `row` / `col`, желаемая сторона для новой генерации; default row на пустой схеме |
| targetCells | optional readonly `{keyId, half, row, col}[]`, желаемые назначения для ещё не соединённых клавиш |

Числа округляются в существующей precision0.0001u; положительное значение после округления обязательно. Верхняя граница расстояний — existing finite project-coordinate span; проверяется также каждый построенный point, bends/segments/bytes limits. Нет бесконечного значения, NaN или нуля. Target rows/cols — целые 0..254, unique keyId, existing key, half соответствует key; duplicate cells допускаются как видимая repairable domain ошибка, не silently reassign. Лимит targetCells <=512. Связь с удалённой key очищается её domain operation, imported broken references сообщаются по пути поля.

Desired targetCells — не фактическая matrix. `getWiringCells` и shield analysis продолжают выводить реальные назначения из wires/nets. Для несоединённого key UI отдельно показывает желаемую ячейку и missing connection. Экспорт не получает fallback из targetCells. Уже существующие actual assignments при регенерации сохраняются, если пользователь явно не предложил изменение. При расхождении desired/actual UI показывает оба; Prettify ничего не переприсваивает. При ручной перенастройке обновлять намерение вместе с реальным edit в одном domain commit либо явно показывать расхождение, не держать скрытый второй truth.

Глобальные rowPin/diodeSide — предпочтение, не доказательство состояния старой/ручной схемы. Current toggle state выводится из actual connections/KeyDiode: uniform, mixed, unknown или direct-not-applicable. Mixed/unknown требуют явного выбора целевого единого состояния; не угадывать «инверсию» произвольной смеси. Global Apply проверяет все keys/halves атомарно.

Wire.locked защищает не только serialized object: pin positions, resolved pooled contacts, direct junction/crossing attachments и terminal meaning входят в protection snapshot. Снимок derived, не persisted. KeyDiode остаётся `{pin, cathode}`; новое поле/дубликат diode object не нужен. `diodeDirection` остаётся существующим Wiring field. При pin swap выбранный diodeSide не меняется, но KeyDiode.pin пересчитывается: row → rowPin, col → противоположный pin. При diode transfer rowPin не меняется. Cathode вычисляется по существующему diodeDirection и новой физической стороне; направление сканирования остаётся прежним.

## Migration and resources

1. Frozen `legacy-v13-project-schema.ts` валидирует legacy вход до v13→v14; старые v1..12 проходят свои existing checkpoints.
2. v13→v14 меняет только schemaVersion; wire locks/routing отсутствуют. Чистые default queries дают unlocked/legacy, не добавляя провода/диоды/терминалы или changing GPIO.
3. Обновить CURRENT_SCHEMA_VERSION, migration registry, createProject/type/schema и derived project JSON schema/agent package. Если другой merge занял v14 — заново определить следующий номер, не переписать принятую migration.
4. Новые settings/locked fields проходят current storage schema, strict nested shape и resource checks. Старые malformed файлы не становятся валидными за счёт расширения live schema. Новые версии отказываются без записи в current Project.
5. Сохранить deterministic schema key order/newline и compact near-budget fallback. Keys512, bytes5MiB, bends64/wire, crossings8192 и contact pool limits не снижать. Новые wires2000/segments16000 вводятся только после measured stress gate; frozen old schemas сохраняют старые ограничения, current schema допускает расширенные.

## Transient operation types

`RoutingScope`: discriminated `kind: all | half | selection`; half содержит half, selection stable keyIds/net descriptors разрешённые относительно base. Нельзя перенести selection ref из другой ревизии. Граница scope содержит неподвижные contact endpoints, out-of-scope objects не меняются.

`WiringProposalRequest`: operation regenerate/prettify/swap-pins/move-diodes, scope, draft settings и typed board facts. Global operations нормализуют scope=all и показывают это до запуска. Для regeneration targetCells берутся из explicit request/actual assignments/показанного automatic proposal в этом порядке; Prettify их не читает для создания связей.

`WiringProposal`: immutable base reference на UI стороне, source revision/request ID transient, candidate Project, typed changes, protected object IDs, advisories, blockers, unconnected pin descriptors и equivalence summary. Список изменений различает preserved/added/replaced/removed и settings-only. Project refs/Worker transport copies не сохраняются в файле. В domain proposal нет времени/request counter/DOM.

Worker reply имеет discriminant `kind: changed | no-change | refused` и echo source revision/request token на transport envelope. `changed` содержит candidate и полный diff, включая settings-only; `no-change` не содержит candidate и означает равенство всех применяемых полей, а не только геометрии. Внутри Worker domain по-прежнему возвращает исходную локальную ссылку при no-op, но transport превращает это в no-change. UI никогда не сравнивает Worker clone с main-thread base по ссылке: для актуального no-change сохраняет оригинальный main-thread Project, показывает нулевой summary/disabled Apply, не вызывает commit/autosave. Late no-change проходит те же stale guards.

`RoutingFailure`: code, readable message, path к source entity, related wire/key/terminal IDs, repair action. Entity path не пустой при fault конкретного объекта. Advisory не добавляется в saved ValidationIssue/export blocker; electrical saved issues продолжают принадлежать combined analysis.

## State transitions

- idle → calculating: capture base+provider revision+request, start local Worker; no history/autosave.
- calculating → ready/refused: принять только matching token; актуальный no-change без candidate даёт ready summary с нулём изменений и неактивным Apply, сохраняет original main-thread Project и не вызывает commit/autosave; cloned identity для no-op не сравнивается.
- calculating/ready → stale при любом accepted Project transition; устаревший результат не оживает после Undo. UI сохраняет явное объяснение и Recalculate.
- calculating/ready/stale/refused → idle через Cancel/editor dismissal; terminate/discard late worker result, return focus, zero history.
- ready → Apply: повторная проверка latest base+revision, domain invariants, one provider commit, atomic routes+settings. Consume request; duplicate Apply no-op. Undo/Redo восстанавливают весь Project, включая locks/settings.
- lock/unlock-only → one ordinary domain commit; не пропускать смешанный unlock+mutation candidate через guard.

Worker source eagerly встроен в initially loaded bundle, не хранится в Project; constructor создаёт локальный Blob Worker и может повторно использоваться offline после terminate. Worker lifecycle принадлежит UI и очищается при unmount; domain steps остаются synchronous. Никакого persistent job graph, второго electrical model или редактируемой копии Project после Apply.
