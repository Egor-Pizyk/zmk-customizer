# Tasks: Action panel rework

First pass (behavior select + scrollable list, 2026-09-29 – 2026-10-06) is superseded by the redesign below; its fixes carried over where the code survives (draft tied to the binding it was made over, single tab stop, `min-w-0` list, Escape effect in `action-panel.tsx`).

Redesign (binding line + slot picker):

- [x] T1 (test-first): `set-key-behavior.test.ts`, `is-every-key-sending-key.test.ts`; implement both; delete `set-press-mode.ts`, `get-press-mode.ts`, `is-every-key-press.ts` (+tests) once unused.
- [x] T2: catalog `BEHAVIORS` gains `tag` and `group`, loses `choices`; `behaviors.test.ts` checks tags and groups.
- [x] T3 (test-first): `binding-slots.test.ts` — slots per behavior, ZMK spelling of values, draft slots; implement `binding-slots.ts`.
- [x] T4 (test-first): `slot-choices.test.ts` — groups per slot, A–Z letters, rare consumer codes last, every keycode once, prompts; implement `slot-choices.ts`, extend `to-picker-item.ts`.
- [x] T5 (test-first): `pick-slot.test.ts` — store vs draft, next slot, multi-key conversion, bt profile slot; implement `pick-slot.ts` (+ `pick-result.ts`, `pick-value.ts`); `draft-state.ts` (+test, from `behavior-intent.ts`).
- [x] T6: `use-key-picker.ts`, `create-pick-handlers.ts`, `create-option-handlers.ts` on the new model.
- [x] T7: components `binding-line.tsx`, `slot-picker.tsx`, `choice-list.tsx` + `choice-option.tsx`, `slot-extras.tsx`, `action-panel-body.tsx`; `DocsLink` takes `tabIndex`/`onKeyDown`, `ModifierToggles` a `label` and shows the ZMK function.
- [x] T8: keycap tag on the canvas + click opens the behavior slot.
- [x] T9: delete replaced files (plan "Removed"); `npm run check` green.
- [x] T10: Drive the app in Chrome (headless, 2026-10-06): empty key → `&kp` → Q, auto-advance keeps the `&kp` draft → W; `&mt` hold/tap slots; `&bt BT_SEL 0` → `BT_NXT` drops the profile slot; tap-dance "Add tap" opens tap 2; list starts on the current row, ArrowRight reaches its docs link (v0.3 anchor), ArrowLeft returns; a press on a keycap tag opens the behavior slot; dark mode; no console errors.
- [x] T12 (user feedback 2026-10-06): Shift symbol on keycaps (`format-binding-legend.test.ts` first); larger binding-line slots; no folded group, larger group chips and headers; external-link arrow instead of "Docs"; no legend box in rows (behaviors show their tag as code); default panel width 448 px. Checked in Chrome.
- [ ] T11: Manual a11y checklist (screen reader, 200% zoom) + record here.

**Verify**: `make check` (or `npm run check`).

## Remove category navigation (2026-10-15)

- [x] T13 (FR-006/FR-007/FR-012/FR-014): Add browser regression for absence of category navigation in behavior and key pickers, preserved group headings/search, keyboard selection and saved binding/Undo.
- [x] T14 (FR-006): Remove GroupChips and unused group scroll state/handlers in choice-list.tsx; preserve list interaction.
- [x] T15: Run full checks and production browser suite, three sequential changed-scenario passes per browser, and record evidence/limits in verification.md.

Evidence for T13–T15: [verification.md](verification.md). T11 remains open for manual screen-reader/200% zoom checks.
