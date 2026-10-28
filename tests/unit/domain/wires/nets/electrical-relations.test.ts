import { expect, it } from 'vitest';
import { getElectricalRelations, getNets } from '@domain/wires/nets';
import type { Project, Wire, WirePoint } from '@domain';
import { buildProject, freeEnd, keyPin } from '../../../../helpers/build-project';

const SPINE: Wire = { id: 'w0', start: freeEnd(0, 0), end: freeEnd(4, 0), bends: [] };
function branch(at: WirePoint): Wire {
  return {
    id: 'w1',
    start: keyPin('k0', 1),
    end: { kind: 'junction', wireId: 'w0', at },
    bends: at.yU === 0 ? [{ xU: at.xU, yU: 2.3667 }] : [{ xU: 0.3, yU: at.yU }],
  };
}
function branched(at: WirePoint): Project {
  return buildProject({ keys: [{ id: 'k0', xU: 0, yU: 2 }], wires: [SPINE, branch(at)] });
}

it('describes ordered labelled attachment sites independently of bends and movable junction coordinates', () => {
  const before = branched({ xU: 1, yU: 0 });
  const after = branched({ xU: 2, yU: 0 });
  expect(getElectricalRelations(before).conductors).toEqual([
    { wireId: 'w0', id: 'spine', sites: [['end:w0:start'], ['junction:w1:end'], ['end:w0:end']] },
    {
      wireId: 'w1',
      id: 'spine',
      sites: [
        ['end:w1:start', 'pin:k0:1'],
        ['end:w1:end', 'junction:w1:end'],
      ],
    },
  ]);
  expect(getElectricalRelations(after)).toEqual(getElectricalRelations(before));
});

it('detects branch order changes even when every net participant remains the same', () => {
  const before = withContact(branched({ xU: 1, yU: 0 }));
  const after = withContact(branched({ xU: 3.5, yU: 0 }));
  expect(participants(after)).toEqual(participants(before));
  expect(getElectricalRelations(after)).not.toEqual(getElectricalRelations(before));
});

it('distinguishes a junction on a pin lead from a junction on the main spine', () => {
  const before = withContact(branched({ xU: 2.3, yU: 1 }));
  const after = withContact(branched({ xU: 1.5, yU: 0 }));
  expect(participants(after)).toEqual(participants(before));
  expect(getElectricalRelations(after)).not.toEqual(getElectricalRelations(before));
});

it('resolves pooled contacts by value and ignores storage representation and contact array order', () => {
  const inline = withContact(branched({ xU: 1, yU: 0 }));
  const pooled = {
    ...inline,
    wireContacts: [{ keyId: 'k1', pin: 1 as const, at: { xU: 2, yU: 0 } }],
    wires: [{ ...SPINE, contactIds: [0] }, branch({ xU: 1, yU: 0 })],
  };
  expect(getElectricalRelations(pooled)).toEqual(getElectricalRelations(inline));
});

it('keeps insulation semantics when an insulated geometric crossing disappears or is introduced', () => {
  const crossed = crossing(true);
  const detoured = {
    ...crossed,
    insulatedCrossings: [],
    wires: [
      requiredWire(crossed, 0),
      {
        id: 'w1',
        start: freeEnd(2, -1),
        end: freeEnd(2, 1),
        bends: [
          { xU: 5, yU: -1 },
          { xU: 5, yU: 1 },
        ],
      },
    ],
  };
  expect(getElectricalRelations(detoured)).toEqual(getElectricalRelations(crossed));
  expect(getElectricalRelations(crossing(false))).not.toEqual(getElectricalRelations(crossed));
});

it('keeps connected crossing identity when new insulated events change its geometric ordinal', () => {
  const spine: Wire = { id: 'w0', start: freeEnd(0, 1), end: freeEnd(6, 1), bends: [] };
  const vertical: Wire = {
    id: 'w1',
    start: freeEnd(0, -1),
    end: freeEnd(6, -1),
    bends: [
      { xU: 4, yU: -1 },
      { xU: 4, yU: 2 },
      { xU: 6, yU: 2 },
    ],
  };
  const before = buildProject({ wires: [spine, vertical] });
  const after = {
    ...before,
    wires: [
      spine,
      {
        ...vertical,
        bends: [
          { xU: 1, yU: -1 },
          { xU: 1, yU: 2 },
          { xU: 2, yU: 2 },
          { xU: 2, yU: -1 },
          ...vertical.bends,
        ],
      },
    ],
    insulatedCrossings: [
      { wireIds: ['w0', 'w1'] as const, ordinal: 0 },
      { wireIds: ['w0', 'w1'] as const, ordinal: 1 },
    ],
  };
  expect(getElectricalRelations(after)).toEqual(getElectricalRelations(before));
});

it('detects replacing a shared conductor span by one contact while preserving net membership', () => {
  const shared = buildProject({
    wires: [
      SPINE,
      {
        id: 'w1',
        start: freeEnd(1, -1),
        end: freeEnd(3, 1),
        bends: [
          { xU: 1, yU: 0 },
          { xU: 3, yU: 0 },
        ],
      },
    ],
  });
  const crossed = {
    ...shared,
    wires: [
      SPINE,
      {
        id: 'w1',
        start: freeEnd(1, -1),
        end: freeEnd(3, 1),
        bends: [
          { xU: 2, yU: -1 },
          { xU: 2, yU: 1 },
        ],
      },
    ],
  };
  expect(participants(crossed)).toEqual(participants(shared));
  expect(getElectricalRelations(crossed)).not.toEqual(getElectricalRelations(shared));
});

it('merges contiguous shared spans across irrelevant geometric bends', () => {
  expect(getElectricalRelations(sharedCorners(2.5))).toEqual(
    getElectricalRelations(sharedCorners(2)),
  );
});

it('preserves fixed free ends, isolated fragments, physical diode and controller meanings', () => {
  const project = crossing(true);
  const moved = {
    ...project,
    wires: [{ ...SPINE, end: freeEnd(5, 0) }, requiredWire(project, 1)],
  };
  expect(getElectricalRelations(moved)).not.toEqual(getElectricalRelations(project));
  expect(getElectricalRelations({ ...project, controllerId: 'xiao_ble' })).not.toEqual(
    getElectricalRelations(project),
  );
  expect(getElectricalRelations({ ...project, wires: [] })).not.toEqual(
    getElectricalRelations(project),
  );
});

function withContact(project: Project): Project {
  return {
    ...project,
    keys: [...project.keys, { id: 'k1', xU: 2, yU: 2 }],
    wires: [
      { ...SPINE, contacts: [{ keyId: 'k1', pin: 1, at: { xU: 2, yU: 0 } }] },
      requiredWire(project, 1),
    ],
  };
}
function crossing(insulated: boolean): Project {
  return buildProject({
    wires: [SPINE, { id: 'w1', start: freeEnd(2, -1), end: freeEnd(2, 1), bends: [] }],
    insulatedCrossings: insulated ? [{ wireIds: ['w0', 'w1'], ordinal: 0 }] : [],
  });
}
function participants(project: Project) {
  return getNets(project).map((net) => ({ pins: net.pins, wireIds: net.wireIds }));
}
function sharedCorners(xU: number): Project {
  const bends = [
    { xU, yU: 0 },
    { xU, yU: 2 },
  ];
  return buildProject({
    wires: [
      { id: 'w0', start: freeEnd(0, 0), end: freeEnd(4, 2), bends },
      { id: 'w1', start: freeEnd(1, 0), end: freeEnd(3, 2), bends },
    ],
  });
}

function requiredWire(project: Project, index: number): Wire {
  const wire = project.wires[index];
  if (wire === undefined) {
    throw new Error(`Missing fixture wire ${index}`);
  }
  return wire;
}

it('keeps a conceptual pin lead stable when zero-length geometry becomes a visible branch', () => {
  const source = buildProject({
    keys: [{ id: 'k0', xU: 0, yU: 0 }],
    wires: [
      {
        id: 'w0',
        start: freeEnd(0, 0.3667),
        end: freeEnd(4, 0.3667),
        bends: [],
        contacts: [{ keyId: 'k0', pin: 1, at: { xU: 0.3, yU: 0.3667 } }],
      },
    ],
  });
  const candidate = {
    ...source,
    wires: [
      {
        ...requiredWire(source, 0),
        bends: [
          { xU: 0, yU: 0 },
          { xU: 4, yU: 0 },
        ],
        contacts: [{ keyId: 'k0', pin: 1 as const, at: { xU: 0.3, yU: 0 } }],
      },
    ],
  };
  expect(getElectricalRelations(candidate)).toEqual(getElectricalRelations(source));
});

it('ignores contact storage ordering while retaining physical site ordering', () => {
  const source = reorderedContacts(false);
  expect(getElectricalRelations(reorderedContacts(true))).toEqual(getElectricalRelations(source));
});

it('captures diode polarity and terminal GPIO meaning even without a connectivity change', () => {
  const source: Project = {
    ...branched({ xU: 1, yU: 0 }),
    wiring: {
      kind: 'matrix',
      topology: 'unibody',
      diodeDirection: 'col2row',
      terminals: [{ id: 't0', half: 'left', kind: 'row', boardPin: 2 }],
    },
  };
  const diode = {
    ...source,
    keys: [{ id: 'k0', xU: 0, yU: 2, diode: { pin: 1 as const, cathode: 'away-switch' as const } }],
  };
  const changedPin = {
    ...source,
    wiring: {
      ...source.wiring,
      kind: 'matrix' as const,
      topology: 'unibody' as const,
      diodeDirection: 'col2row' as const,
      terminals: [{ id: 't0', half: 'left' as const, kind: 'row' as const, boardPin: 3 }],
    },
  };
  expect(getElectricalRelations(diode)).not.toEqual(getElectricalRelations(source));
  expect(getElectricalRelations(changedPin)).not.toEqual(getElectricalRelations(source));
});

function reorderedContacts(reverse: boolean): Project {
  const contacts = [
    { keyId: 'k0', pin: 1 as const, at: { xU: 1, yU: 0 } },
    { keyId: 'k1', pin: 1 as const, at: { xU: 2, yU: 0 } },
  ];
  return buildProject({
    keys: [
      { id: 'k0', xU: 0, yU: 2 },
      { id: 'k1', xU: 1, yU: 2 },
    ],
    wires: [{ ...SPINE, contacts: reverse ? contacts.toReversed() : contacts }],
  });
}
