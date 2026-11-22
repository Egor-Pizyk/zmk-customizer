import { expect, it } from 'vitest';
import { setWireLocked, validateWireProtection } from '@domain/wires/protection';
import { buildLockedWiringProject } from '../../../../helpers/symmetric-wiring-fixtures';

it('sets and clears only the explicit wire lock and preserves no-op identity', () => {
  const project = buildLockedWiringProject();
  expect(setWireLocked(project, { wireId: 'w0', isLocked: true })).toBe(project);
  expect(setWireLocked(project, { wireId: 'w99', isLocked: false })).toBe(project);
  const unlocked = setWireLocked(project, { wireId: 'w0', isLocked: false });
  expect(unlocked.wires[0]).not.toHaveProperty('locked');
  expect(unlocked.keys).toBe(project.keys);
  expect(validateWireProtection(project, unlocked)).toEqual([]);
  const relocked = setWireLocked(unlocked, { wireId: 'w0', isLocked: true });
  expect(relocked).toEqual(project);
  expect(project.wires[0]?.locked).toBe(true);
});
