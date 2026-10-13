import { expect, it } from 'vitest';
import { buildProject } from '../../tests/helpers/build-project';
import { duplicateKeys } from '../domain/duplicate-keys';
import { editLayout } from '../domain/edit-layout';
import { removeKeys } from '../domain/remove-keys';
import { renumberKeys } from '../domain/renumber-keys';
import { setKeyGeometries } from '../domain/set-key-geometries';
import { applyHistoryAction, createInitialState } from './project-state';

it('retains history identity and redo for effective-default, capped and unknown layout operations', () => {
  const project = buildProject({ keys: [{ id: 'k0', xU: 0, yU: 0 }] });
  const initial = createInitialState({ project, status: { kind: 'ok' } });
  const renamed = applyHistoryAction(initial, {
    action: { kind: 'commit', update: (current) => ({ ...current, name: 'Renamed' }) },
  });
  const undone = applyHistoryAction(renamed, { action: { kind: 'undo' } });
  const updates = [
    (current: typeof project) =>
      setKeyGeometries(current, {
        changes: [{ keyId: 'k0', geometry: { widthU: 1, rotationDeg: 0 } }],
      }),
    (current: typeof project) => duplicateKeys(current, { keyIds: ['k0'], maxKeyCount: 1 }),
    (current: typeof project) => removeKeys(current, { keyIds: ['missing'] }),
    (current: typeof project) =>
      editLayout(current, { keyIds: ['k0'], offset: { xU: 0, yU: 0 }, geometry: {} }),
    renumberKeys,
  ];
  for (const update of updates) {
    expect(applyHistoryAction(undone, { action: { kind: 'commit', update } })).toBe(undone);
  }
  expect(applyHistoryAction(undone, { action: { kind: 'redo' } }).history.present.name).toBe(
    'Renamed',
  );
});
