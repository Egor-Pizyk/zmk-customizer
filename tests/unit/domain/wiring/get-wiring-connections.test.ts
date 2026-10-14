import { getWiringConnections } from '@domain/wiring';
import { expect, it } from 'vitest';
import { getDefinedValue } from '../../../helpers/defined-value';
import { buildWiringProject } from '../../../helpers/wiring-project';

it('only emits existing axes for incomplete assignments and respects swapped contact pins', () => {
  const wiring = getDefinedValue(buildWiringProject().wiring);
  expect(getWiringConnections(wiring, [{ keyId: 'k0', half: 'left' }])).toEqual([]);
  expect(getWiringConnections(wiring, [{ keyId: 'k0', half: 'left', row: 0, rowPin: 2 }])).toEqual([
    { keyId: 'k0', pin: 2, terminalId: 't0' },
  ]);
  expect(getWiringConnections(wiring, [{ keyId: 'k0', half: 'left', col: 0 }])).toEqual([
    { keyId: 'k0', pin: 2, terminalId: 't2' },
  ]);
  const direct = getDefinedValue(buildWiringProject('direct').wiring);
  expect(getWiringConnections(direct, [{ keyId: 'k0', half: 'left' }])).toEqual([
    { keyId: 'k0', pin: 2, terminalId: 't11' },
  ]);
});
