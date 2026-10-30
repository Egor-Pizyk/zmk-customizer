import { getProjectAnalysis } from '@ui/project/logic';
import { getSchematicGeometry } from '@ui/schematic/interaction';
import type { SchematicLayerProps } from '@ui/schematic/rendering/logic';
import type { DiagramCell } from './diagram-types';
import { projectDiagramEnds } from './project-diagram-ends';
import { projectDiagramBridges } from './project-diagram-bridges';
import { projectDiagramPins } from './project-diagram-pins';
import { projectDiagramKeys } from './project-diagram-keys';
import { projectDiagramSections } from './project-diagram-sections';
import { projectDiagramEncoders } from './project-diagram-encoders';

export type ProjectDiagramInput = Pick<
  SchematicLayerProps,
  'project' | 'view' | 'selection' | 'activeKeyId' | 'marks'
>;
export type DiagramArtworkInput = ProjectDiagramInput &
  ReturnType<typeof getSchematicGeometry> & {
    readonly crossings: ReturnType<typeof getProjectAnalysis>['crossings'];
  };

// Profiling found repeated shared-surface renders recomputing electrical sections for the same
// immutable Project. Keep one presentation variant per weak Project key; pan is applied by Paper.
const projections = new WeakMap<
  ProjectDiagramInput['project'],
  { readonly input: ProjectDiagramInput; readonly cells: readonly DiagramCell[] }
>();

export function projectDiagram(input: ProjectDiagramInput): readonly DiagramCell[] {
  const previous = projections.get(input.project);
  if (previous !== undefined && hasSameProjectionInput(previous.input, input)) {
    return previous.cells;
  }
  const cells = buildProjection(input);
  projections.set(input.project, { input, cells });
  return cells;
}
function hasSameProjectionInput(previous: ProjectDiagramInput, input: ProjectDiagramInput) {
  return (
    previous.selection === input.selection &&
    previous.activeKeyId === input.activeKeyId &&
    previous.marks === input.marks &&
    previous.view.pxPerU === input.view.pxPerU
  );
}
function buildProjection(input: ProjectDiagramInput): readonly DiagramCell[] {
  const geometry = getSchematicGeometry(input.project);
  const props: DiagramArtworkInput = {
    ...input,
    ...geometry,
    crossings: getProjectAnalysis(input.project).crossings,
  };
  return [
    ...projectDiagramKeys(props),
    ...projectDiagramSections(input),
    ...projectDiagramBridges(props),
    ...projectDiagramEnds(props),
    ...projectDiagramEncoders(props),
    ...projectDiagramPins(props),
  ];
}
