import { getNets } from '@domain/wires/nets';
import type { Net } from '@domain/wires/nets';
import type { Half, KeyPin, Project } from '@domain';

export type WiringCell = {
  readonly keyId: string;
  readonly half: Half;
  readonly row?: number;
  readonly col?: number;
  readonly rowPin?: KeyPin;
};

export function getWiringCells(
  project: Project,
  nets: readonly Net[] = getNets(project),
): readonly WiringCell[] {
  return project.keys.map((key) => getKeyCell(project, { key, nets }));
}

function getRowFields(
  kind: string | undefined,
  input: {
    readonly row: number | undefined;
    readonly rowPin: KeyPin | undefined;
    readonly inputPin: KeyPin | undefined;
  },
) {
  if (kind === 'direct' && input.inputPin !== undefined) {
    return { row: 0, rowPin: input.inputPin };
  }
  if (input.row !== undefined) {
    return { row: input.row, rowPin: input.rowPin ?? 1 };
  }
  return input.inputPin === undefined
    ? {}
    : { rowPin: input.inputPin === 1 ? (2 as const) : (1 as const) };
}

function getKeyCell(
  project: Project,
  { key, nets }: { readonly key: Project['keys'][number]; readonly nets: readonly Net[] },
): WiringCell {
  const half = key.half ?? 'left';
  const { rowIds, colIds } = getTerminalAxes(project, half);
  const connections = ([1, 2] as const).map((pin) => ({
    pin,
    ids:
      nets.find((net) => net.pins.some((entry) => entry.keyId === key.id && entry.pin === pin))
        ?.terminalIds ?? [],
  }));
  const rowConnection = connections.find((connection) =>
    connection.ids.some((id) => rowIds.includes(id)),
  );
  const colConnection = connections.find((connection) =>
    connection.ids.some((id) => colIds.includes(id)),
  );
  const row = rowConnection?.ids.flatMap((id) =>
    rowIds.includes(id) ? [rowIds.indexOf(id)] : [],
  )[0];
  const col = colConnection?.ids.flatMap((id) =>
    colIds.includes(id) ? [colIds.indexOf(id)] : [],
  )[0];
  return {
    keyId: key.id,
    half,
    ...getRowFields(project.wiring?.kind, {
      row,
      rowPin: rowConnection?.pin,
      inputPin: colConnection?.pin,
    }),
    ...(col === undefined ? {} : { col }),
  };
}

function getTerminalAxes(project: Project, half: Half) {
  const terminals = project.wiring?.terminals.filter((terminal) => terminal.half === half) ?? [];
  const rowIds = terminals
    .filter((terminal) => terminal.kind === 'row')
    .map((terminal) => terminal.id);
  const colIds = terminals
    .filter((terminal) => terminal.kind === (project.wiring?.kind === 'direct' ? 'input' : 'col'))
    .map((terminal) => terminal.id);
  return { rowIds, colIds };
}
