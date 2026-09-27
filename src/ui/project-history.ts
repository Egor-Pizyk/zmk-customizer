import { assertNever } from '../domain/assert-never';
import type { Project } from '../domain/types';

export const UNDO_LIMIT = 100;

export type ProjectHistory = {
  readonly past: readonly Project[];
  readonly present: Project;
  readonly future: readonly Project[];
};

export type ProjectHistoryAction =
  | { readonly kind: 'commit'; readonly update: (project: Project) => Project }
  | { readonly kind: 'undo' }
  | { readonly kind: 'redo' }
  | { readonly kind: 'replace'; readonly project: Project };

// Generic undo stack (ADR 0003); knows nothing about keyboards, so it lives in ui/ (research R5).
export function reduceProjectHistory(
  history: ProjectHistory,
  action: ProjectHistoryAction,
): ProjectHistory {
  switch (action.kind) {
    case 'commit': {
      const present = action.update(history.present);
      if (present === history.present) {
        return history;
      }
      return { past: [...history.past, history.present].slice(-UNDO_LIMIT), present, future: [] };
    }
    case 'undo': {
      const previous = history.past.at(-1);
      if (previous === undefined) {
        return history;
      }
      return {
        past: history.past.slice(0, -1),
        present: previous,
        future: [history.present, ...history.future],
      };
    }
    case 'redo': {
      const [next, ...future] = history.future;
      if (next === undefined) {
        return history;
      }
      return { past: [...history.past, history.present], present: next, future };
    }
    case 'replace': {
      return { past: [], present: action.project, future: [] };
    }
    default: {
      return assertNever(action);
    }
  }
}
