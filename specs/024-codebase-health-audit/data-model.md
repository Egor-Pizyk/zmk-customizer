# Data model and transitions

Project остаётся plain JSON существующей schemaVersion; bigint, request tokens, analysis и BindingDraft в JSON не записываются.

- Entity ID: непрозрачная строка k/w/l + decimal suffix. Новые IDs уникальны среди сущностей и сохраняемых dangling/reserved references. Существующие IDs сохраняются.
- Import session: provider-lived request generation + Project revision. Begin Open заменяет request; Project edit/New/preset меняют revision. Completion применима только к обоим текущим значениям; stale failures также игнорируются. Отмена из-за edit сообщается.
- Resource budget: counts keys/wires/layers/bends per wire/total segments и прочих вложенных project collections. Измеренные limits применяются к file/localStorage после migration; structural rejection не заменяет editable domain issues.
- SaveError: invalid-project с безопасной диагностикой; storage-unavailable; quota-exceeded. Invalid-project не вызывает write.
- ProjectAnalysis: привязан к immutable Project; contacts/nets/issues/matrix согласованы. Invalid analysis блокирует generated files. Geometry cache, если нужен, зависит от геометрии и electrical fields, не bindings/name.
- BindingDraft: union по behaviorId. Каждая ветка содержит только свои параметры. Begin/select/change behavior/commit/cancel/layer deletion/selection change имеют явные переходы и не сохраняются в Project до commit.
- No-op domain operation: возвращает исходную ссылку; history/future/autosave остаются неизменными.

## BindingDraft transition table

| behaviorId | Поля draft | Pick → результат |
|---|---|---|
| kp/sk/kt | key | keycode → commit; hold slot запрещён |
| mt | обязательный hold, optional key | hold → draft/tap slot; tap → commit |
| bt | btCommand, profile | обычная command → commit; profile command без profile → draft; profile → commit |
| out | outCommand | command → commit |
| mo/tog/to/sl | layerId | layer → commit |
| lt | layerId, key | layer/tap в любом порядке; complete → commit, incomplete → следующий slot |

Change behavior создаёт новую branch; несовместимые поля не переносятся. Cancel/изменение binding через pick/paste/undo выводит stored binding. Смена/удаление layer сбрасывает draft, search и pending modifiers; одинаковое binding на соседних keys сохраняет текущий draft по существующему продуктового контракту.
