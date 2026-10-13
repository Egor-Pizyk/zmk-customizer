import { expect, it } from 'vitest';
import { buildWiringProject } from '../../../helpers/wiring-project';
import { getResultValue } from '../../../helpers/result';
import { getDefinedValue } from '../../../helpers/defined-value';
import { routeWiring, getNets, getWiringConnections } from '@domain';

it('preserves unrelated wire paths while changing the actual affected buses', () => {
  const project = buildWiringProject();
  const wiring = getDefinedValue(project.wiring);
  const connections = getWiringConnections(wiring, [
    { keyId: 'k0', half: 'left', row: 0, col: 0, rowPin: 1 },
    { keyId: 'k1', half: 'left', row: 0, col: 1, rowPin: 1 },
    { keyId: 'k2', half: 'left', row: 0, col: 2, rowPin: 1 },
  ]).filter((connection) => connection.terminalId === 't0');
  const routed = getResultValue(routeWiring(project, { connections, terminalIds: ['t0'] }));
  const oldAffected = getDefinedValue(
    getNets(project).find((net) => net.terminalIds.includes('t0')),
  ).wireIds;
  expect(
    routed.wires
      .filter((wire) => !wire.start.kind.includes('free'))
      .filter((wire) => project.wires.some((old) => old.id === wire.id)),
  ).toEqual(project.wires.filter((wire) => !oldAffected.includes(wire.id)));
  expect(
    getDefinedValue(getNets(routed).find((net) => net.terminalIds.includes('t0'))).pins,
  ).toEqual([
    { keyId: 'k0', pin: 1 },
    { keyId: 'k1', pin: 1 },
    { keyId: 'k2', pin: 1 },
  ]);
});
it('refuses missing references without mutating the original project', () => {
  const project = buildWiringProject();
  const before = structuredClone(project);
  expect(
    routeWiring(project, {
      connections: [{ keyId: 'missing', pin: 1, terminalId: 't0' }],
      terminalIds: ['t0'],
    }).ok,
  ).toBe(false);
  expect(
    routeWiring(project, {
      connections: [{ keyId: 'k0', pin: 1, terminalId: 'missing' }],
      terminalIds: [],
    }).ok,
  ).toBe(false);
  expect(project).toEqual(before);
});

it('refuses coincident key pins rather than accepting a routed short', () => {
  const base = buildWiringProject('direct');
  const project = {
    ...base,
    keys: base.keys.slice(0, 3).map((key) => coincident(key)),
    wires: [],
    insulatedCrossings: [],
  };
  const terminals = getDefinedValue(project.wiring).terminals;
  const inputs = terminals.filter((terminal) => terminal.kind === 'input').slice(0, 3);
  const connections = inputs.map((terminal, index) => ({
    keyId: `k${index}`,
    pin: 1 as const,
    terminalId: terminal.id,
  }));
  expect(
    routeWiring(project, { connections, terminalIds: terminals.map((terminal) => terminal.id) }).ok,
  ).toBe(false);
  expect(project.wires).toEqual([]);
});
it('enforces the wire budget before producing an oversized route', () => {
  const base = buildWiringProject();
  const original = getDefinedValue(base.wires[0]);
  const project = {
    ...base,
    wires: Array.from({ length: 601 }, (_value, index) => ({ ...original, id: `w${index}` })),
  };
  expect(routeWiring(project, { connections: [], terminalIds: [] })).toEqual({
    ok: false,
    error: 'Routing exceeds 600 wires. Simplify the circuit.',
  });
});
function coincident(key: ReturnType<typeof buildWiringProject>['keys'][number]) {
  return { ...key, xU: 0, yU: 0 };
}
