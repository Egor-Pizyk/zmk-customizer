# Implementation Plan: Action panel rework

**Feature**: `specs/006-action-panel-rework/spec.md`

## Architecture

### Domain (`src/domain/`)

- `set-key-behavior.ts` — `setKeyBehavior(project, { layerIndex, keyIds, behavior })`, `behavior` = `{ id: 'kp' | 'sk' | 'kt' }` or `{ id: 'mt', hold }`: each kp/sk/kt/mt binding becomes the target keeping its key stroke (mt keeps its own hold, others get `hold`); other kinds stay. Replaces `setPressMode`, `getPressMode` and `isEveryKeyPress`, which lose their last users.
- `is-every-key-sending-key.ts` — `isEveryKeySendingKey(project, target)`: every selected key is kp, sk, kt or mt (FR-008 decides between converting and drafting).
- Everything else reused: `setKeycode`, `setHoldKey`, `setBindings`, `setKeyPressModifier`, tap-dance and mod-morph operations, `isEveryKeyPress`.

### Catalog

- `BEHAVIORS` entries gain `tag` (`&kp`…, `tap-dance`, `mod-morph`) and `group` (`Send a key`, `Special`, `Connection`, `Firmware`, `Your behaviors`); `choices` goes (its only reader, `behavior-action.ts`, goes).

### UI pure modules (`src/ui/bindings/`, each with a test)

- `binding-slots.ts` — `SlotRef` union (`behavior`, `key`, `hold`, `tap`, `bt-command`, `profile`, `out-command`, `dance-tap(index)`, `morph-side(side)`); `BindingDraft` (behavior + values so far); `LineSource` = stored binding | draft | none; `getLineSlots(source)` → `{ ref, label, value }[]` with values in ZMK spelling (`formatStrokeCode`: `LC(A)`); `isSameSlot`.
- `slot-choices.ts` — `getSlotChoices(ref)` → groups of `PickerItem` (module constants, stable references); key groups from keycode categories, Media = the curated 13, the rest of media/consumer last (all listed at once); `formatSlotPrompt(ref)`.
- `to-picker-item.ts` — `PickerPick` gains `behavior`, `bt-command`, `profile`, `out-command`; loses `binding`; builders per kind; `widthU` already gone.
- `pick-slot.ts` (+ `pick-result.ts` types and helpers, `pick-value.ts` value picks) — `toPickResult({ source, slot, pick, target, pendingModifiers, isEveryKeySendingKey })` → `{ kind: 'store', change, next? }` | `{ kind: 'draft', draft, next }`. Encodes FR-008/FR-009/FR-011: which domain operation(s) a pick runs, whether it drafts, which slot opens next (`undefined` = binding done, auto-advance).
- `behavior-intent.ts` → `draft-state.ts` — `{ draft, over }`, `resolveLineSource` shows the draft while `over` equals the shared binding; `createDraft` (mt starts with `LEFT_SHIFT`); a blank draft stays after storing.
- `binding-slots.ts` also: `resolveOpenSlot` (clamp), `findSlotValueId` (current row), `findModifierTarget` (what the chips change).

### UI state and components

- `use-key-picker.ts` — open slot (clamped in render to the line's slots), search, pending modifiers, draft state; `syncSelection` resets search, modifiers and slot. Hover/details, tabs, tap/side arming go. Copy/paste move to the panel header (`action-panel-body.tsx`).
- `create-pick-handlers.ts` — `handlePick` runs `toPickResult`, commits or drafts, opens the next slot or auto-advances. `create-option-handlers.ts` — modifier chips per open slot, tap-dance add/remove/pause, mod-morph triggers.
- Components: `action-panel-body.tsx` (header with selection name and copy/paste, then line, picker, extras), `binding-line.tsx`, `slot-picker.tsx` (prompt, search, chips, list), `choice-list.tsx` + `choice-option.tsx` (grouped list, roving tab stop, docs link via ArrowRight; rows without a legend box, canonical code and first alias shown), `slot-extras.tsx` (chips, tap-dance remove/pause, mod-morph triggers, auto-advance).
- Canvas: `keycap-shape.tsx` draws the tag top-right (`data-keycap-tag`) and the Shift symbol beside the tap symbol (`BindingLegend.shifted` from `format-binding-legend.ts`); `use-bindings-pointer.ts` opens the behavior slot when the press starts on it.
- `DocsLink` renders an external-link arrow icon (`components/icons/external-link-icon.tsx`) with the docs name as screen-reader text and tooltip.
- Removed: `behavior-section.tsx`, `behavior-action.ts`, `key-picker.tsx`, `picker-list.tsx`, `picker-tab-bar.tsx`, `picker-tabs.ts`, `visible-picker-tabs.ts`, `action-panel-sections.ts`, `picker-preview.tsx`, `key-options.tsx`, `hold-select.tsx`, `behavior-options.tsx`, `tap-dance-options.tsx`, `mod-morph-options.tsx`, `basic-pick-handlers.ts`, `tap-dance-handlers.ts`, `mod-morph-handlers.ts`, `toggle-key-modifier.ts` (folded into the new handlers) and their tests.

## Accessibility

- Binding line: `role="group"` "Binding"; each part a `<button aria-pressed>` named "Tap: A" etc.
- List: one tab stop (roving) of `<button>` rows (`aria-label` name + ", current", `aria-describedby` description and codes); docs links `tabIndex=-1`, reached with ArrowRight; group headers are visible text, chips are buttons with `aria-current` for the group in view.
- Escape to canvas stays in `action-panel.tsx` (react.md effects table).

## Risks

- A draft made over a stored binding also applies to another selection with an identical binding (harmless: the last chosen behavior shows).
- Keycap tag adds text at small zoom; it follows the same zoom rule as the legend (hidden when too small to read).
