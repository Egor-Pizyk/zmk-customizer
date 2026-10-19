import type { Binding, Project } from '@domain';
import { createProject } from './create-project';
import type { PresetBindingMode, PresetLayout } from './preset-layout';

export function createLayoutPresetProject(input: {
  readonly preset: PresetLayout;
  readonly controllerId: string;
  readonly bindingMode: PresetBindingMode;
}): Project {
  const { preset } = input;
  const bindings: Record<string, Binding> = {};
  const keys = preset.keys.map(({ keycode, ...geometry }, keyIndex) => {
    const id = `k${keyIndex}`;
    if (input.bindingMode === 'qwerty') {
      bindings[id] = { kind: 'kp', key: { keycode, modifiers: [] } };
    }
    return { id, ...geometry };
  });
  const project: Project = {
    ...createProject({ controllerId: input.controllerId }),
    name: preset.name,
    keys,
    layers: [{ id: 'l0', name: 'Base', bindings }],
  };
  if (preset.topology === 'unibody') {
    return project;
  }
  return {
    ...project,
    wiring: { kind: 'matrix', topology: 'split', diodeDirection: 'col2row', terminals: [] },
  };
}
