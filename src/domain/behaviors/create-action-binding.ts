import type { Binding, Project } from '@domain';
import { createBehaviorBinding } from './create-behavior-binding';

export function createActionBinding(project: Project, kind: string): Binding {
  if (project.macros.some((macro) => macro.id === kind)) {
    return { kind: 'macro', macroId: kind };
  }
  const key = { keycode: 'A', modifiers: [] } as const;
  const layerId = project.layers[0]?.id ?? 'l0';
  if (kind === 'bt') {
    return { kind, command: 'BT_CLR' };
  }
  if (kind === 'out') {
    return { kind, command: 'OUT_TOG' };
  }
  if (kind === 'mt') {
    return { kind, hold: { keycode: 'LSHIFT', modifiers: [] }, tap: key };
  }
  switch (kind) {
    case 'kp':
    case 'sk':
    case 'kt': {
      return { kind, key };
    }
    case 'lt': {
      return { kind, layerId, tap: key };
    }
    case 'mo':
    case 'tog':
    case 'to':
    case 'sl': {
      return { kind, layerId };
    }
    default: {
      return createFixedAction(project, kind);
    }
  }
}

function createFixedAction(project: Project, kind: string): Binding {
  switch (kind) {
    case 'trans':
    case 'none':
    case 'caps_word':
    case 'key_repeat':
    case 'gresc':
    case 'sys_reset':
    case 'bootloader': {
      return { kind };
    }
    default: {
      return createBehaviorBinding(project, kind);
    }
  }
}
