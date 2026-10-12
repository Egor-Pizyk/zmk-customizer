# Quickstart: validate Layers

## Automated

```
make check        # agents sync + typecheck + lint + format check + tests (CI)
```

Covers: domain layer operations and SC-002 reorder test (`src/domain/move-layer.test.ts`), validation codes (`validate-layers.test.ts`, `validate-bindings.test.ts`), storage accept/reject rules (`contracts/project-json.md` → `parse-project-file.test.ts`, `project-schema.test.ts`), preference fallback (`preferences.test.ts`), slots/choices/picks and formatting (`src/ui/bindings/*.test.ts`), behavior catalog order and docs links (`behaviors.test.ts`).

## Browser (real Chrome)

1. `npm run dev -- --port 5199 --strictPort` (host) and, in a scratch folder outside the repo, `npm i playwright-core`; scripts use `chromium.launch({ channel: 'chrome' })`.
2. Seed `localStorage['zmk-customizer:project']` with a v3 project of ~10 keys and one Base layer, reload, click the "Bindings" tab. Keycaps: `[data-keycap-id="k1"]`; panel: `[data-action-panel]`.
3. Scenarios (screenshots light and dark via `colorScheme`):
   - Add layer → tab "1 Layer 1" opens, every key shows `▽`; rename to "Nav" (Enter); field shows "Keymap node: nav_layer".
   - On Base select k1 → behavior `&mo` → layer row "Nav" → keycap shows tag `&mo` and legend "Nav"; line `&mo [layer 1 Nav]`.
   - k2 `&kp SPACE` → behavior `&lt` → layer "Nav" → line `&lt [layer 1 Nav] [tap SPACE]`.
   - Add "Sym", move it left → tabs `0 Base`, `1 Sym`, `2 Nav`; k1 line reads `[layer 2 Nav]`.
   - Delete "Nav" → status "Deleted layer Nav. Undo"; Problems lists k1 and k2 under Bindings; click a problem → Base opens, key focused; Mod+Z → problems gone.
   - Keyboard only: Tab to the tab list, ArrowRight/Home/End switch layers; Tab to "Layer name", type, Enter; Tab to "Move right", Space; "Delete layer"; canvas copy (Mod+C) on Base, switch layer, paste (Mod+V).
   - Rename a layer to `nav` while "Nav" exists → field error and a Bindings problem "… both become nav_layer …".
4. Reload: layers, names, order and layer behaviors identical; the open layer position is remembered.
5. Stop the dev server.

## Manual (owner)

Screen reader smoke test (VoiceOver + Safari) and 200% zoom at 1280 px per `docs/guidelines/frontend/accessibility.md` checklist items 8 and 10 — left open in `tasks.md` for the project owner.
