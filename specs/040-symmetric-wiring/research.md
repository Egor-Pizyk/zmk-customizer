# 040 — research decisions

Дата: 2026-10-27. Источники — текущая ревизия `9c461b4` и owning docs; это source research, не измерение реализованного продукта. Исследование mutation/storage границ выполнено также read-only research agent в рамках speckit-plan. Продуктовые решения приняты в Clarifications spec, здесь только техническое следствие.

## R1 — topology and physical pins

**Decision:** существующая матрица и bus — стили одной topology. Direct — отдельные pin2/input и pin1/GND paths только при явной новой генерации. Старую схему не мигрировать электрически.

**Evidence:** `get-wiring-connections.ts` различает row/col и input/ground; `get-key-pin-position.ts` задаёт pin1 на -2.54 мм Y, pin2 на -5.08 мм Y относительно центра до вращения. Значит локально pin1 нижний. `edit-wiring.ts/toDirectCells` исторически выбирает input1. Проверенные `docs/zmk/kscan.md` задают один GPIO/key+GND и matrix diode-direction.

**Rationale:** request вводит новый direct style, но не разрешает при открытии проекта переподключить реальную клавиатуру. **Rejected:** два GPIO/key, новый scan driver, смешение геометрии/топологии.

## R2 — lock guard on complete candidate

**Decision:** policy в низкоуровневом wires module, одинаковая проверка в публичных edit owners и defensive provider commit boundary. Исключение unlock-only узкое, Undo/Redo/confirmed replacement отдельны.

**Evidence:** `remove-keys.ts` последовательно вызывает удаление: отказ одной клавиши не защищает группу от частичного удаления. `Wire` содержит anchors, inline и pool contactIds; key move может поменять displayed path без смены wire fields. `project-state.ts/applyHistoryAction` — seam до сохранения; generic reducer не должен знать о проводах.

**Rationale:** сравнение кандидата закрывает все массовые обходы. **Rejected:** UI-only disabled, net-wide lock, сравнение одних wire fields, импорт editing из policy с циклом зависимостей.

## R3 — exact electrical preservation

**Decision:** Prettify сохраняет wire IDs и reference graph; independent relation signature включает pin/terminal identity, junction attachment sites, branch adjacency, free ends, connected/insulated crossings и diode flow. Actual scan ordering сравнивается отдельно; экспорт проверяется byte-for-byte в тестах.

**Evidence:** `preserve-key-wiring.ts` precedent проверяет pin partitions, но свободные fragments и junction-only relations требуют большего. CrossingRef ordinal зависит от геометрии; insulated refs исчезнувших событий удаляются, новые создаются, а electrical signature сохраняет separation и intentional branch contacts, не число геометрических событий; v12 contacts explicit, geometry alone не определяет membership key-pin. Источник: 033 data-model.

**Rationale:** одинаковое число nets или output одной удачной конфигурации не доказывает сохранение всей незавершённой схемы. **Rejected:** исправлять electrical errors внутри Prettify, merge/split wires ради длины, inferred JointJS connections.

## R4 — bounded deterministic routes

**Decision:** pure local segment index и конечный поиск: preferred, outward shifts до 64 шагов, затем до 128 прямоугольных кандидатов на span. Нормализация координат по half/outward направлению обеспечивает зеркальные tie-breaks; roundU/tolerance существующей geometry. Score и failure заданы plan/contract.

**Rationale:** полная глобальная оптимальность не обещана и не нужна; конечность даёт воспроизводимость и bounded work. **Rejected:** автоматический router/anchors JointJS как электрическая модель, случайные offsets, новый routing package. Лимит поиска требует честного сообщения и не означает математическую невозможность маршрута.

## R5 — responsive preview and ABA

**Decision:** локальный inline bundled UI Worker выполняет synchronous pure domain operation. Eager static `?worker&inline` import загружается с первоначальным app bundle; нет lazy/external worker chunks. У transport явные changed/no-change/refused replies; no-change без candidate сохраняет main-thread base reference, settings-only = changed. Существующий provider `importSession.getRevision()` плюс base reference и request token предотвращает late/ABA Apply. Worker terminates на Cancel/supersede/unmount; accepted Project не публикуется промежуточно.

**Evidence:** `use-wiring-preview.ts` сейчас использует только base identity, а 038 plan/source уже предоставляет revision getter. `use-project-state.ts` invalidates до render при accepted transition. Domain async запрещён owning rules, но UI async допустим; frontend «только import/ZIP async» должен получить узкое согласованное дополнение до реализации.

**Rationale:** synchronous seconds-long main-thread расчёт противоречит Cancel<=200ms. **Build evidence:** inline worker mode документирован в [официальном Vite guide](https://vite.dev/guide/features.html#web-workers), проверено 2026-10-27. Локальная manifest использует Vite8; установленного node_modules/vite для type inspection нет, поэтому actual production build/browser proof остаётся задачей. В `infra/nginx.conf` сейчас script-src self без worker-src: inline Blob Worker требует только нового worker-src blob:, без data: и без расширения script/connect directives. Browser tests проверяют first-use/restart offline с реальной nginx CSP.

**Rejected:** второй revision counter, mutable worker-owned committed graph, useTransition как отмена вычисления, silent stale clearing без Recalculate.

## R6 — resources, legacy and load target

**Decision:** v14 (если база всё ещё v13), frozen v13 checkpoint, lock absence = unlocked, routing absence = legacy defaults без redraw. Бюджет wires 2000/segments16000 — целевое расширение, обоснованное SC-004 и обязательным stress gate, не уже подтверждённая безопасность.

**Evidence:** `PROJECT_BUDGET`: 512 keys, 600 wires, 3000 segments; 5 MiB. v13 current schema и checkpoints v11/v12 в `parse-project-file.ts`. SC-004 превосходит текущий wire budget; после I2 scope явно закреплён в spec: whole-schematic Prettify500/2000, selected8×8 regeneration в полном окружении и whole largest-valid-preset generation под тем же бюджетом. GPIO limits остаются реальными: 500-key direct не превращается в валидный проект из-за geometry benchmark.

**Rationale:** нельзя считать отказ по старому лимиту выполнением нагрузки. Whole-schematic Prettify stress может сохранять незавершённые цепи; regeneration stress обрабатывает допустимую selected область в большом окружении, отдельно проверяется атомарный GPIO refusal. **Rejected:** фальшивый controller fixture для UI performance, снятие 5 MiB, обрезание старых данных, reduction of SC-004.
