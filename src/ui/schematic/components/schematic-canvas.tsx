import { getProjectAnalysis } from '@ui/project/logic';
import { getSchematicGeometry } from '@ui/schematic/interaction';
import type { HoverPreview, useEditingPointer } from '@ui/schematic/interaction';
import type { Project } from '@domain';
import { WorkSurface, MarqueeLayer } from '@ui/canvas/components';
import type { SurfaceContent, ContentView } from '@ui/canvas/logic';
import {
  BendHandles,
  HoverPreviewLayer,
  SchematicEditingScreenLayer,
} from '@ui/schematic/rendering/components';
import { getWireBendHandles } from '@ui/schematic/rendering/logic';
import { projectDiagram, normalizeDiagramPointerInput } from '@ui/schematic/diagram/logic';
import { SchematicDiagram } from '@ui/schematic/diagram/components';
import type { SchematicLayerProps } from '@ui/schematic/rendering/logic';
import { useState } from 'react';
import type { ReactNode } from 'react';

type SchematicCanvasProps = Omit<SchematicLayerProps, 'view' | 'paths' | 'crossings'> &
  PointerHandlers & {
    readonly hoverPreview: HoverPreview;
    readonly commit: (change: (project: Project) => Project) => void;
    /** The tool window overlay. */
    readonly children: ReactNode;
    readonly hasTransformFrames: boolean;
    readonly isReadOnly?: boolean;
  };

type ContentInput = Omit<SchematicCanvasProps, 'children' | keyof PointerHandlers>;
type PointerHandlers = ReturnType<typeof useEditingPointer>['surfaceHandlers'];

function createSurfaceContent(
  input: ContentInput,
  handlers: PointerHandlers,
  availability: {
    readonly isUnavailable: boolean;
    readonly onAvailabilityChange: (value: boolean) => void;
  },
): SurfaceContent {
  const { project, onKeyKeyDown: handleKeyKeyDown, onKeyFocus: handleKeyFocus } = input;
  const handleAvailabilityChange = availability.onAvailabilityChange;
  const handlePointerCancel = handlers.onPointerCancel;
  const crossings = getProjectAnalysis(project).crossings;
  const { paths } = getSchematicGeometry(project);
  return {
    ...(availability.isUnavailable ? {} : createNativePointerHandlers(handlers, project)),
    kind: 'host',
    label: `Schematic canvas, ${project.keys.length} keys. The Parts list below lists every key, wire and crossing.`,
    renderHost: (view) => (
      <SchematicDiagram
        input={{ cells: projectDiagram({ ...input, view }), view }}
        onKeyKeyDown={handleKeyKeyDown}
        onKeyFocus={handleKeyFocus}
        onDispose={handlePointerCancel}
        onAvailabilityChange={handleAvailabilityChange}
      />
    ),
    renderScreen: (view) =>
      availability.isUnavailable ? null : (
        <SchematicOverlay {...input} paths={paths} crossings={crossings} view={view} />
      ),
  };
}

function createNativePointerHandlers(handlers: PointerHandlers, project: Project) {
  const result: Pick<
    Extract<SurfaceContent, { readonly kind: 'host' }>,
    'onPointerDown' | 'onPointerMove' | 'onPointerUp' | 'onPointerCancel' | 'onPointerLeave'
  > = {
    onPointerDown: (world, event) => {
      handlers.onPointerDown(world, normalizeDiagramPointerInput({ world, event, project }));
    },
    onPointerMove: (world, event) => {
      handlers.onPointerMove(world, normalizeDiagramPointerInput({ world, event, project }));
    },
    onPointerUp: (world, event) => {
      handlers.onPointerUp(world, normalizeDiagramPointerInput({ world, event, project }));
    },
    onPointerCancel: handlers.onPointerCancel,
    onPointerLeave: handlers.onPointerLeave,
  };
  return result;
}

function SchematicOverlay(
  props: ContentInput &
    Pick<SchematicLayerProps, 'paths' | 'crossings'> & { readonly view: ContentView },
) {
  const {
    project,
    view,
    paths,
    crossings,
    marquee,
    hoverPreview,
    commit,
    hasTransformFrames,
    isReadOnly,
    selection,
  } = props;
  return (
    <>
      <g
        className="pointer-events-auto"
        transform={`translate(${view.panXPx} ${view.panYPx}) scale(${view.pxPerU})`}
      >
        {isReadOnly === true ? null : (
          <BendHandles handles={getWireBendHandles(project, paths)} pxPerU={view.pxPerU} />
        )}
        <MarqueeLayer marquee={marquee} />
        <HoverPreviewLayer preview={hoverPreview} view={view} />
      </g>
      <SchematicEditingScreenLayer
        crossings={crossings}
        isReadOnly={isReadOnly}
        commit={commit}
        project={project}
        view={view}
        hasTransformFrames={hasTransformFrames}
        selection={selection}
      />
    </>
  );
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
  const [isUnavailable, setIsUnavailable] = useState(false);
  const content = createSurfaceContent(input, handlers, {
    isUnavailable,
    onAvailabilityChange: setIsUnavailable,
  });
  return (
    <WorkSurface content={content} workspaceId="schematic">
      {children}
    </WorkSurface>
  );
}
