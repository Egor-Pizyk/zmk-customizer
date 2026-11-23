import { assertNever } from '@domain';
import type { Project } from '@domain';
import { getWireSections } from '@domain/wires';
import type { CanvasHit } from '@ui/schematic/interaction';

export function resolveDiagramHit(project: Project, hit: CanvasHit): CanvasHit {
  const empty = { kind: 'empty' } as const;
  switch (hit.kind) {
    case 'control':
    case 'empty': {
      return hit;
    }
    case 'key':
    case 'pin': {
      return project.keys.some((key) => key.id === hit.keyId) ? hit : empty;
    }
    case 'encoder': {
      return project.encoders.some((encoder) => encoder.id === hit.encoderId) ? hit : empty;
    }
    case 'encoder-pin': {
      return project.encoders.some(
        (encoder) => encoder.id === hit.encoderId && encoder.wiringMode === 'schematic',
      )
        ? hit
        : empty;
    }
    case 'wire':
    case 'wire-end':
    case 'bend': {
      return project.wires.some((wire) => wire.id === hit.wireId) ? hit : empty;
    }
    case 'section': {
      return getWireSections(project).some(
        (section) => section.id === hit.sectionId && section.wireId === hit.wireId,
      )
        ? hit
        : empty;
    }
    default: {
      return assertNever(hit);
    }
  }
}
