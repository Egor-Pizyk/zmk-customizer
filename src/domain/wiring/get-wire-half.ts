import type { Half, Project, Wire } from '@domain';

export function getWireHalf(project: Project, wire: Wire): Half {
  if (project.wiring?.topology !== 'split') {
    return 'left';
  }
  const pending = [wire];
  const visited = new Set<string>();
  for (const current of pending) {
    if (visited.has(current.id)) {
      continue;
    }
    visited.add(current.id);
    const half = getDirectHalf(project, current);
    if (half !== undefined) {
      return half;
    }
    pending.push(...getJunctionTargets(project, current));
  }
  return 'left';
}

function getDirectHalf(project: Project, wire: Wire): Half | undefined {
  for (const end of [wire.start, wire.end]) {
    if (end.kind === 'key-pin') {
      return project.keys.find((key) => key.id === end.keyId)?.half ?? 'left';
    }
    if (end.kind === 'free' && end.terminalId !== undefined) {
      return (
        project.wiring?.terminals.find((terminal) => terminal.id === end.terminalId)?.half ?? 'left'
      );
    }
  }
  return undefined;
}

function getJunctionTargets(project: Project, wire: Wire) {
  return [wire.start, wire.end].flatMap((end) => {
    if (end.kind !== 'junction') {
      return [];
    }
    const target = project.wires.find((entry) => entry.id === end.wireId);
    return target === undefined ? [] : [target];
  });
}
