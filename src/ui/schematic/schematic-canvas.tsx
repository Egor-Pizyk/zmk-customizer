import type { ReactNode } from 'react';
import { getProjectAnalysis } from '@ui/project';
import { getSchematicGeometry } from './interaction/get-schematic-geometry';
import type { Project } from '@domain';
import type { ContentPointerHandler, SurfaceContent } from '@ui/canvas';
import { WorkSurface } from '@ui/canvas';
import type { HoverPreview } from './interaction/get-hover-preview';
import { SchematicContent } from './rendering/schematic-content';
import type { SchematicLayerProps } from './rendering/schematic-layer-props';
import { SchematicEditingScreenLayer } from './rendering/schematic-editing-screen-layer';

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
  readonly hasTransformFrames: boolean;
};

type ContentInput = Omit<SchematicCanvasProps, 'children' | keyof PointerHandlers>;
type PointerHandlers = Pick<
  SurfaceContent,
  'onPointerDown' | 'onPointerMove' | 'onPointerUp' | 'onPointerCancel' | 'onPointerLeave'
>;

function createSurfaceContent(input: ContentInput, handlers: PointerHandlers): SurfaceContent {
  const { project, hoverPreview, commit, marquee, hasTransformFrames, ...layerProps } = input;
  const crossings = getProjectAnalysis(project).crossings;
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
      <SchematicEditingScreenLayer
        crossings={crossings}
        commit={commit}
        project={project}
        view={view}
        hasTransformFrames={hasTransformFrames}
        selection={layerProps.selection}
      />
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
