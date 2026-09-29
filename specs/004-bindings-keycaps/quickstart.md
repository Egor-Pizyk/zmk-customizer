# Quickstart: validate Bindings keycaps

## Prerequisites

`make up` (http://localhost:5173), `make check` green on the branch.

## Automated

```
make check
```

The tests cover:
- `parse-keys-header` / catalog invariants ([contracts/catalog.md](contracts/catalog.md));
- `migrate-v2-to-v3` on `tests/fixtures/project/v2.json`;
- the schema accepting and rejecting inputs ([contracts/project-schema.md](contracts/project-schema.md));
- `setBindings`, `setKeyPressModifier`, `removeKey` (bindings dropped, others kept);
- `getSharedBinding`, `validateBindings` codes and paths ([contracts/validation-issues.md](contracts/validation-issues.md));
- `formatBindingLegend` cases (`A`, `⌃⇧A`, `$` for `DOLLAR` and for `N4` + `LS`/`RS`, mod-tap `␣`/`⇧`, `▽`, `✕`, `BT 1`, truncation);
- `getPanelStepForSelection`.

## Manual

1. **Mirror (US1)**: in Schematic, draw 4 keys and wires with a board pin. Open Bindings (Alt+Shift+2):
   - you see 4 empty keycaps at the same places, and the wires are dimmed behind them;
   - dragging a keycap moves nothing, and Undo stays unavailable.
2. **Assign (US2)**:
   - Click key 0, choose "Send a key", type `spa`, press Enter. The keycap shows `␣`.
   - Click key 1, and the panel opens directly on the key list (FR-009a). Type `$` and choose Dollar. The keycap shows `$`.
   - Toggle L⌃. The keycap shows `⌃$`. Undo once, and it is back to `$`.
3. **Mod-tap and Bluetooth**:
   - Key 2: "Modifier on hold, key on tap". Hold: Left Shift, tap: Space. The legend is `␣` with `⇧` small below.
   - Key 3: Bluetooth → Select profile → 1. The legend is `BT 1`.
4. **Multi and copy/paste (US4)**:
   - Ctrl+click keys 0 and 3. The panel says "2 keys selected, different actions". Choose "Do nothing": both show ✕. One undo restores both.
   - Select key 2, press Mod+C, select key 0, press Mod+V. Key 0 now shows the mod-tap legend.
5. **Keyboard only (US5, SC-006)**, with the mouse unplugged:
   - Tab to the canvas and use the arrows to reach key 1. Enter moves focus to the panel. Assign `F13` by search, then use Escape to get back to the keycap.
   - In the table, select 2 rows with Space and assign "Pass-through".
6. **Project (US6)**:
   - Delete key 1 in Schematic. Back in Bindings, the keys formerly 2 and 3 keep their actions.
   - Reload, and everything is the same. Save the file, start a new project, open the file: identical.
   - Open a spec 003 project file: it loads, and every keycap is empty.
7. **Bad file (FR-022)**: edit a saved file so that one binding has keycode `BANG`, and another has `BT_SEL` with profile 7. Open it: two problems appear under Bindings, the badge shows 2, and activating one focuses the key's row and selects it. Set `kind` to `foo` and open the file: it is rejected with a message, and the current project is unchanged.
8. **Docs**: open the docs links of "Send a key" and of three categories (letters, symbols, media). Each lands on the right v0.3 section (research R3).
9. **Accessibility pass**: the checklist in `docs/guidelines/frontend/accessibility.md`, steps 1–10, in both themes, at 200% zoom and with reduced motion. Record the result in `tasks.md`.
