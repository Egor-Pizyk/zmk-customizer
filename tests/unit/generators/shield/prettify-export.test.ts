import { expect, it } from 'vitest';
import { getControllerBoard } from '@catalog/controllers';
import { ZMK_LIMITS, SHIELD_TARGET } from '@catalog/firmware';
import { prettifyWiring } from '@domain/wiring/editing';
import { getRoutingSettings } from '@domain/wiring';
import { deriveShieldMatrix } from '@domain/wiring/matrix';
import { generateRepositoryFiles } from '@generators/repository';
import type { Project, Key, Wire, WiringTerminal } from '@domain';
import { UNIBODY_PRESET } from '../../../helpers/unibody-preset';
import { getResultValue } from '../../../helpers/result';

it.each(['matrix', 'direct', 'split-matrix', 'split-direct'] as const)(
  'preserves actual generated file paths and bytes for %s',
  (kind) => {
    const source = sourceFor(kind);
    const before = files(source);
    const candidate = getResultValue(
      prettifyWiring(source, {
        settings: getRoutingSettings(source),
        limits: ZMK_LIMITS,
        scope: { kind: 'all' },
      }),
    ).project;
    expect(files(candidate)).toEqual(before);
    expect(candidate.wires).not.toEqual(source.wires);
    expect(candidate.keys).toEqual(source.keys);
    expect(candidate.wiring).toEqual(source.wiring);
    expect(
      getResultValue(
        prettifyWiring(candidate, {
          settings: getRoutingSettings(candidate),
          limits: ZMK_LIMITS,
          scope: { kind: 'all' },
        }),
      ).project,
    ).toBe(candidate);
  },
);

function files(project: Project) {
  const board = getControllerBoard(project.controllerId);
  return generateRepositoryFiles(project, {
    includeWorkflow: false,
    target: { ...SHIELD_TARGET, ...board, boardId: board.id },
    matrix: getResultValue(deriveShieldMatrix(project, { ...board, boardId: board.id })),
  });
}
function matrix(): Project {
  return { ...UNIBODY_PRESET, wires: UNIBODY_PRESET.wires.map(matrixDetour) };
}
function matrixDetour(wire: Wire): Wire {
  return wire.id === 'w0'
    ? {
        ...wire,
        bends: [
          { xU: 0.3, yU: -0.5 },
          { xU: -1, yU: -0.5 },
        ],
      }
    : wire;
}
function sample(kind: string): Project {
  const direct = kind.includes('direct');
  const halves = kind.startsWith('split') ? (['left', 'right'] as const) : (['left'] as const);
  const keys: Key[] = [];
  const terminals: WiringTerminal[] = [];
  const wires: Wire[] = [];
  for (const [index, half] of halves.entries()) {
    const xU = index * 8;
    const keyId = `k${index}`;
    keys.push({
      id: keyId,
      xU,
      yU: 0,
      half,
      ...(direct ? {} : { diode: { pin: 1, cathode: 'away-switch' } as const }),
    });
    terminals.push(
      { id: `t${index * 2}`, half, kind: direct ? 'input' : 'row', boardPin: 0 },
      {
        id: `t${index * 2 + 1}`,
        half,
        kind: direct ? 'ground' : 'col',
        ...(direct ? {} : { boardPin: 1 }),
      },
    );
    wires.push(
      {
        id: `w${index * 2}`,
        half,
        start: { kind: 'key-pin', keyId, pin: 1 },
        end: { kind: 'free', at: { xU: xU - 1, yU: 0.3667 }, terminalId: `t${index * 2}` },
        bends: [
          { xU: xU + 0.3, yU: -0.5 },
          { xU: xU - 1, yU: -0.5 },
        ],
      },
      {
        id: `w${index * 2 + 1}`,
        half,
        start: { kind: 'key-pin', keyId, pin: 2 },
        end: { kind: 'free', at: { xU: xU + 2, yU: 0.2333 }, terminalId: `t${index * 2 + 1}` },
        bends: [],
      },
    );
  }
  return {
    ...UNIBODY_PRESET,
    keys,
    wires,
    insulatedCrossings: [],
    layers: [{ id: 'l0', name: 'Base', bindings: {} }],
    shieldName: 'prettify_sample',
    wiring: {
      kind: direct ? 'direct' : 'matrix',
      topology: halves.length === 2 ? 'split' : 'unibody',
      diodeDirection: 'col2row',
      terminals,
    },
  };
}

function sourceFor(kind: string): Project {
  return kind === 'matrix' ? matrix() : sample(kind);
}
