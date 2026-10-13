import { deriveWiring } from '../wiring/derive-wiring';
import { validateSchematic } from '../validation/validate-schematic';
import { validateNetsWithoutBoardPin } from '../validation/validate-nets-without-board-pin';
import { findKeyCurrentFlow } from '../wires/find-key-current-flow';
import { getNets } from './get-nets';
import type { Net, NetBoardPin } from './get-nets';
import type { KeyPin, Project, Result, ValidationIssue } from '../types';

export type ShieldTarget = {
  readonly boardId: string;
  readonly gpioPins: readonly number[];
};
export type ShieldMatrix = {
  readonly kind?: 'matrix' | 'direct';
  readonly halves?: Readonly<
    Record<
      'left' | 'right',
      { readonly rowPins: readonly number[]; readonly colPins: readonly number[] }
    >
  >;
  readonly rowPins: readonly number[];
  readonly colPins: readonly number[];
  readonly cells: readonly { readonly row: number; readonly col: number }[];
  readonly diodeDirection: 'row2col' | 'col2row';
};
type Edge = { readonly keyIndex: number; readonly first: number; readonly second: number };
type MatrixGraph = { readonly edges: readonly Edge[]; readonly nets: readonly Net[] };
type ColoredGraph = MatrixGraph & { readonly isRowByNet: ReadonlyMap<number, boolean> };

function findNet(
  nets: readonly Net[],
  input: { readonly keyId: string; readonly pin: KeyPin },
): number {
  return nets.findIndex((net) =>
    net.pins.some((pin) => pin.keyId === input.keyId && pin.pin === input.pin),
  );
}

function validateBoardPin(
  project: Project,
  input: {
    readonly pin: NetBoardPin;
    readonly target: ShieldTarget;
  },
): ValidationIssue[] {
  const { pin, target } = input;
  const wireIndex = project.wires.findIndex((wire) => wire.id === pin.wireId);
  const path = ['wires', wireIndex, pin.side, 'boardPin'];
  const issues: ValidationIssue[] = [];
  if (!target.gpioPins.includes(pin.boardPin)) {
    issues.push({
      code: 'shield-pin-unsupported',
      message: `D${pin.boardPin} on wire ${wireIndex} is unavailable for ${target.boardId}. Choose an exposed connector pin: ${target.gpioPins.join(', ')}.`,
      path,
    });
  }
  return issues;
}

function validateNets(
  project: Project,
  nets: readonly Net[],
  input: { readonly target: ShieldTarget; readonly schematicIssues: readonly ValidationIssue[] },
): ValidationIssue[] {
  const { target, schematicIssues } = input;
  const issues: ValidationIssue[] = [];
  for (const net of nets) {
    const firstPin = net.pins[0];
    if (firstPin === undefined) {
      const wireIndex = project.wires.findIndex((wire) => wire.id === net.wireIds[0]);
      issues.push({
        code: 'shield-net-unused',
        message: `Wire ${wireIndex} is not connected to a key. Remove it or connect it in Schematic.`,
        path: ['wires', wireIndex],
      });
    }
    for (const pin of net.boardPins) {
      issues.push(...validateBoardPin(project, { pin, target }));
    }
  }
  const electricalCodes = new Set([
    'board-pin-conflict',
    'board-pins-shorted',
    'key-shorted',
    'keys-in-parallel',
    'net-without-board-pin',
  ]);
  issues.push(
    ...schematicIssues.filter((issue) => electricalCodes.has(issue.code)),
    ...validateNetsWithoutBoardPin(
      project,
      nets.filter((net) => net.wireIds.length === 0),
    ),
  );
  return issues;
}

function colorComponent(
  graph: MatrixGraph,
  input: { readonly seed: number; readonly isRowByNet: Map<number, boolean> },
): ValidationIssue[] {
  const { seed, isRowByNet } = input;
  isRowByNet.set(seed, true);
  const queue = [seed];
  const issues: ValidationIssue[] = [];
  for (const netIndex of queue) {
    const isRow = isRowByNet.get(netIndex) ?? false;
    for (const edge of graph.edges.filter(
      (candidate) => candidate.first === netIndex || candidate.second === netIndex,
    )) {
      const other = edge.first === netIndex ? edge.second : edge.first;
      if (isRowByNet.get(other) === isRow) {
        issues.push({
          code: 'matrix-not-bipartite',
          message: `Key ${edge.keyIndex} forms a wiring cycle that cannot be scanned as rows and columns. Rewire the cycle in Schematic.`,
          path: ['keys', edge.keyIndex],
        });
      }
      if (!isRowByNet.has(other)) {
        isRowByNet.set(other, !isRow);
        queue.push(other);
      }
    }
  }
  return issues;
}

function colorNets(
  graph: MatrixGraph,
): Result<ReadonlyMap<number, boolean>, readonly ValidationIssue[]> {
  const used = [...new Set(graph.edges.flatMap((edge) => [edge.first, edge.second]))].toSorted(
    (left, right) =>
      (graph.nets[left]?.boardPins[0]?.boardPin ?? 0) -
      (graph.nets[right]?.boardPins[0]?.boardPin ?? 0),
  );
  const isRowByNet = new Map<number, boolean>();
  const issues: ValidationIssue[] = [];
  for (const seed of used) {
    if (!isRowByNet.has(seed)) {
      issues.push(...colorComponent(graph, { seed, isRowByNet }));
    }
  }
  return issues.length === 0 ? { ok: true, value: isRowByNet } : { ok: false, error: issues };
}

function deriveCells(graph: ColoredGraph): Pick<ShieldMatrix, 'rowPins' | 'colPins' | 'cells'> {
  const { nets, edges, isRowByNet } = graph;
  const rowPins = nets
    .flatMap((net, index) =>
      isRowByNet.get(index) === true ? [net.boardPins[0]?.boardPin ?? -1] : [],
    )
    .toSorted((left, right) => left - right);
  const colPins = nets
    .flatMap((net, index) =>
      isRowByNet.get(index) === false ? [net.boardPins[0]?.boardPin ?? -1] : [],
    )
    .toSorted((left, right) => left - right);
  const cells = edges.map((edge) => {
    const firstIsRow = isRowByNet.get(edge.first) === true;
    const rowNet = firstIsRow ? edge.first : edge.second;
    const colNet = firstIsRow ? edge.second : edge.first;
    return {
      row: rowPins.indexOf(nets[rowNet]?.boardPins[0]?.boardPin ?? -1),
      col: colPins.indexOf(nets[colNet]?.boardPins[0]?.boardPin ?? -1),
    };
  });
  return { rowPins, colPins, cells };
}

function deriveDirection(
  project: Project,
  graph: ColoredGraph,
): Result<ShieldMatrix['diodeDirection'], readonly ValidationIssue[]> {
  const directions = graph.edges.flatMap((edge) => {
    const flow = findKeyCurrentFlow(project.keys[edge.keyIndex]);
    if (flow === undefined) {
      return [];
    }
    const firstIsRow = graph.isRowByNet.get(edge.first) === true;
    const direction: ShieldMatrix['diodeDirection'] =
      (flow.fromPin === 1) === firstIsRow ? 'row2col' : 'col2row';
    return [{ keyIndex: edge.keyIndex, direction }];
  });
  const first = directions[0];
  if (first === undefined) {
    return { ok: false, error: [] };
  }
  const issues = directions
    .filter((entry) => entry.direction !== first.direction)
    .map((entry) => ({
      code: 'matrix-diode-conflict' as const,
      message: `Key ${entry.keyIndex} conducts ${entry.direction}, but key ${first.keyIndex} conducts ${first.direction}. Correct its diode polarity or wiring in Schematic.`,
      path: ['keys', entry.keyIndex],
    }));
  return issues.length === 0 ? { ok: true, value: first.direction } : { ok: false, error: issues };
}

function validateMissingDiodes(project: Project): ValidationIssue[] {
  return project.keys.flatMap((key, keyIndex) =>
    key.diode === undefined
      ? [
          {
            code: 'key-diode-missing' as const,
            message: `Key ${keyIndex} has no diode. Add a diode with the correct polarity in Schematic.`,
            path: ['keys', keyIndex],
          },
        ]
      : [],
  );
}

function deriveMatrix(
  project: Project,
  graph: ColoredGraph,
): Result<ShieldMatrix, readonly ValidationIssue[]> {
  const matrix = deriveCells(graph);
  const direction = deriveDirection(project, graph);
  const issues = [...validateMissingDiodes(project), ...(direction.ok ? [] : direction.error)];
  if (!direction.ok || issues.length > 0) {
    return { ok: false, error: issues };
  }
  return { ok: true, value: { ...matrix, diodeDirection: direction.value } };
}

export function deriveShieldMatrix(
  project: Project,
  target: ShieldTarget,
  input: {
    readonly nets?: readonly Net[] | undefined;
    readonly schematicIssues?: readonly ValidationIssue[];
  } = {},
): Result<ShieldMatrix, readonly ValidationIssue[]> {
  if (project.wiring !== undefined) {
    return deriveWiring(project, { id: target.boardId, gpioPins: target.gpioPins, ble: true });
  }
  const nets = input.nets ?? getNets(project);
  const schematicIssues = input.schematicIssues ?? validateSchematic(project, nets);
  if (project.keys.length === 0) {
    return {
      ok: false,
      error: [
        {
          code: 'shield-empty',
          message:
            'The project has no keys. Add keys in Schematic or start from the unibody preset in New.',
          path: ['keys'],
        },
      ],
    };
  }
  const edges = project.keys.map((key, keyIndex) => ({
    keyIndex,
    first: findNet(nets, { keyId: key.id, pin: 1 }),
    second: findNet(nets, { keyId: key.id, pin: 2 }),
  }));
  const issues = validateNets(project, nets, { target, schematicIssues });
  if (issues.length > 0) {
    return { ok: false, error: [...issues, ...validateMissingDiodes(project)] };
  }
  const colored = colorNets({ edges, nets });
  return colored.ok
    ? deriveMatrix(project, { nets, edges, isRowByNet: colored.value })
    : { ok: false, error: [...colored.error, ...validateMissingDiodes(project)] };
}
