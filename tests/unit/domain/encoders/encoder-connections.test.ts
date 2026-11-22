import { describe, expect, it } from 'vitest';
import { createProject } from '@domain/project';
import { placeEncoder, validateEncoders } from '@domain/encoders';
import { getControllerBoard } from '@catalog/controllers';
import { BINDINGS_CATALOG } from '@catalog/bindings';
import { validateSchematic } from '@domain/validation';
import { getWireHalf } from '@domain/wires/geometry';
import type { Project, Wire } from '@domain';

function connected(): Project {
  const project = placeEncoder(createProject({ controllerId: 'nice_nano_v2' }), {
    position: { xU: 10, yU: 10 },
    defaults: { steps: 80, triggersPerRotation: 20 },
    hasPushSwitch: false,
  });
  return {
    ...project,
    wires: [
      {
        id: 'w0',
        start: { kind: 'encoder-pin', encoderId: 'e1', pin: 'A' },
        end: { kind: 'free', at: { xU: 8, yU: 9.85 }, boardPin: 20 },
        bends: [],
      },
      {
        id: 'w1',
        start: { kind: 'encoder-pin', encoderId: 'e1', pin: 'B' },
        end: { kind: 'free', at: { xU: 12, yU: 9.85 }, boardPin: 21 },
        bends: [],
      },
      {
        id: 'w2',
        start: { kind: 'encoder-pin', encoderId: 'e1', pin: 'COM' },
        end: { kind: 'free', at: { xU: 10.5, yU: 8.85 }, ground: true },
        bends: [],
      },
    ],
  };
}
const input = { board: getControllerBoard('nice_nano_v2'), catalog: BINDINGS_CATALOG };

describe('encoder electrical safety', () => {
  it('accepts distinct channels and same-half common ground', () => {
    expect(validateEncoders(connected(), input)).toEqual([]);
  });
  it('requires COM ground and rejects independent signals with the same GPIO', () => {
    const project = connected();
    const missing = { ...project, wires: project.wires.filter((wire) => wire.id !== 'w2') };
    expect(validateEncoders(missing, input)).toContainEqual(
      expect.objectContaining({ code: 'encoder-pin-missing', path: ['encoders', 0, 'wiringMode'] }),
    );
    const reused = {
      ...project,
      wires: project.wires.map(reusePin),
    };
    expect(validateEncoders(reused, input)).toContainEqual(
      expect.objectContaining({ code: 'encoder-pin-conflict' }),
    );
  });
  it('rejects channel bridges and wrong-half routing', () => {
    const project = connected();
    const shorted: Project = {
      ...project,
      wires: [
        ...project.wires,
        {
          id: 'w3',
          start: { kind: 'encoder-pin', encoderId: 'e1', pin: 'A' },
          end: { kind: 'encoder-pin', encoderId: 'e1', pin: 'B' },
          bends: [],
        },
      ],
    };
    expect(validateEncoders(shorted, input)).toContainEqual(
      expect.objectContaining({ code: 'encoder-pin-conflict' }),
    );
    const wrongHalf: Project = { ...project, wires: project.wires.map(onWrongHalf) };
    expect(validateEncoders(wrongHalf, input)).toContainEqual(
      expect.objectContaining({ code: 'encoder-pin-conflict' }),
    );
  });
  it('reports a GPIO physically connected to explicit ground', () => {
    const project = connected();
    const shorted: Project = {
      ...project,
      wires: [
        ...project.wires,
        {
          id: 'w3',
          start: { kind: 'encoder-pin', encoderId: 'e1', pin: 'A' },
          end: { kind: 'free', at: { xU: 7, yU: 9.85 }, ground: true },
          bends: [],
        },
      ],
    };
    expect(validateSchematic(shorted)).toContainEqual(
      expect.objectContaining({ code: 'board-pins-shorted' }),
    );
  });
  it('accepts a ground terminal and rejects foreign-half terminals and key contacts', () => {
    const project = connected();
    const signalA = wireById(project, 'w0');
    const signalB = wireById(project, 'w1');
    const common = wireById(project, 'w2');
    const terminalGround: Project = {
      ...project,
      wiring: {
        kind: 'matrix',
        topology: 'split',
        diodeDirection: 'col2row',
        terminals: [{ id: 't0', half: 'left', kind: 'ground' }],
      },
      wires: [
        signalA,
        signalB,
        {
          ...common,
          end: { kind: 'free', at: { xU: 10.5, yU: 8.85 }, terminalId: 't0' },
        },
      ],
    };
    expect(validateEncoders(terminalGround, input)).toEqual([]);
    expect(getWireHalf(terminalGround, signalA)).toBe('left');

    const foreignTerminal: Project = {
      ...terminalGround,
      wiring: {
        kind: 'matrix',
        topology: 'split',
        diodeDirection: 'col2row',
        terminals: [
          { id: 't0', half: 'left', kind: 'ground' },
          { id: 't1', half: 'right', kind: 'row' },
        ],
      },
      wires: [
        { ...signalA, end: { kind: 'free', at: { xU: 8, yU: 9.85 }, terminalId: 't1' } },
        signalB,
        wireById(terminalGround, 'w2'),
      ],
    };
    expect(validateEncoders(foreignTerminal, input)).toContainEqual(
      expect.objectContaining({ code: 'encoder-pin-conflict' }),
    );

    const foreignKey: Project = {
      ...project,
      keys: [{ id: 'k1', xU: 8, yU: 10, half: 'right' }],
      wires: [
        ...project.wires,
        {
          id: 'w3',
          start: { kind: 'encoder-pin', encoderId: 'e1', pin: 'A' },
          end: { kind: 'key-pin', keyId: 'k1', pin: 1 },
          bends: [],
        },
      ],
    };
    expect(validateEncoders(foreignKey, input)).toContainEqual(
      expect.objectContaining({ code: 'encoder-pin-conflict' }),
    );
  });
});

function reusePin(wire: Wire): Wire {
  if (wire.id !== 'w1') {
    return wire;
  }
  return { ...wire, end: { kind: 'free', at: { xU: 12, yU: 9.85 }, boardPin: 20 } };
}
function onWrongHalf(wire: Wire): Wire {
  return { ...wire, half: 'right' };
}
function wireById(project: Project, id: string): Wire {
  const wire = project.wires.find((entry) => entry.id === id);
  if (wire === undefined) {
    throw new Error(`Missing wire ${id}`);
  }
  return wire;
}
