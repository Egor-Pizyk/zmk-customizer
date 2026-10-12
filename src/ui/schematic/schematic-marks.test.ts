import { expect, it } from 'vitest';
import { buildProject, keyPin } from '../../../tests/helpers/build-project';
import { validateSchematic } from '../../domain/validate-schematic';
import { toWorkspaceIssues } from '../shell/workspace-issue';
import { getSchematicMarks } from './schematic-marks';

it('keeps both connected pin dots filled while their net awaits a board pin', () => {
  const project = buildProject({
    keys: [
      { id: 'k1', xU: 0, yU: 0 },
      { id: 'k2', xU: 2, yU: 0 },
    ],
    wires: [{ id: 'w1', start: keyPin('k1', 1), end: keyPin('k2', 1), bends: [] }],
  });
  const issues = toWorkspaceIssues(validateSchematic(project));
  expect(issues.some((issue) => issue.code === 'net-without-board-pin')).toBe(true);
  expect([...getSchematicMarks(issues).unconnectedPins]).toEqual(['0:2', '1:2']);
});
