import { assertNever } from '@domain';
import type { Project } from '@domain';
import type { CanvasHit } from './read-canvas-hit';
import type { SchematicSelection } from './schematic-selection';

type PreviewSelectionInput = {
  readonly project: Project;
  readonly selection: SchematicSelection;
  readonly hit: CanvasHit;
  readonly shiftKey: boolean;
};

export function getWiringPreviewSelection(input: PreviewSelectionInput): SchematicSelection {
  const { hit, selection } = input;
  switch (hit.kind) {
    case 'key':
    case 'pin': {
      return { kind: 'key', keyId: hit.keyId };
    }
    case 'encoder':
    case 'encoder-pin': {
      return { kind: 'encoder', encoderId: hit.encoderId };
    }
    case 'bend':
    case 'wire': {
      return { kind: 'wire', wireId: hit.wireId };
    }
    case 'wire-end': {
      return { kind: 'wire-end', wireId: hit.wireId, side: hit.side };
    }
    case 'section': {
      return getSectionSelection(input, hit.sectionId);
    }
    case 'control': {
      return selection;
    }
    case 'empty': {
      return undefined;
    }
    default: {
      return assertNever(hit);
    }
  }
}

function getSectionSelection(input: PreviewSelectionInput, sectionId: string): SchematicSelection {
  const { project, selection } = input;
  const previous =
    input.shiftKey && selection?.kind === 'sections' && selection.base === project
      ? selection.sectionIds
      : [];
  const sectionIds = previous.includes(sectionId)
    ? previous.filter((id) => id !== sectionId)
    : [...previous, sectionId];
  return { kind: 'sections', base: project, sectionIds };
}
