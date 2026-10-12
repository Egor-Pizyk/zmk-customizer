import type { ReactNode } from 'react';
import { findCrossings } from '../../domain/find-crossings';
import { getSchematicGeometry } from './get-schematic-geometry';
import type { Project } from '../../domain/types';
import type { ContentPointerHandler, SurfaceContent } from '../canvas/surface-content';
import { WorkSurface } from '../canvas/work-surface';
import type { HoverPreview } from './get-hover-preview';
import { SchematicContent } from './schematic-content';
import type { SchematicLayerProps } from './schematic-layer-props';
import { SchematicScreenLayer } from './schematic-screen-layer';

type SchematicCanvasProps = Omit<SchematicLayerProps, 'view' | 'paths' | 'crossings'> & {
  readonly hoverPreview: HoverPreview;
  readonly onPointerDown: ContentPointerHandler;
  readonly onPointerMove: ContentPointerHandler;
  readonly onPointerUp: ContentPointerHandler;
  readonly onPointerCancel: () => void;
  readonly onPointerLeave: () => void;
  readonly commit: (change: (project: Project) => Project) => void;
  /** The tool window overlay. */
  readonly children: ReactNode;
};

type ContentInput = Omit<SchematicCanvasProps, 'children' | keyof PointerHandlers>;
type PointerHandlers = Pick<
  SurfaceContent,
  'onPointerDown' | 'onPointerMove' | 'onPointerUp' | 'onPointerCancel' | 'onPointerLeave'
>;

function createSurfaceContent(input: ContentInput, handlers: PointerHandlers): SurfaceContent {
  const { project, hoverPreview, commit, marquee, ...layerProps } = input;
  const crossings = findCrossings(project);
  const { paths } = getSchematicGeometry(project);
  return {
    ...handlers,
    label: `Schematic canvas, ${project.keys.length} keys. The Parts list below lists every key, wire and crossing.`,
    render: (view) => (
      <SchematicContent
        {...layerProps}
        crossings={crossings}
        hoverPreview={hoverPreview}
        marquee={marquee}
        paths={paths}
        project={project}
        view={view}
      />
    ),
    renderScreen: (view) => (
      <SchematicScreenLayer crossings={crossings} commit={commit} project={project} view={view} />
    ),
  };
}

export function SchematicCanvas(props: SchematicCanvasProps) {
  const {
    children,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
    onPointerLeave,
    ...input
  } = props;
  const handlers = { onPointerDown, onPointerMove, onPointerUp, onPointerCancel, onPointerLeave };
  const content = createSurfaceContent(input, handlers);
  return (
    <WorkSurface content={content} workspaceId="schematic">
      {children}
    </WorkSurface>
  );
}
