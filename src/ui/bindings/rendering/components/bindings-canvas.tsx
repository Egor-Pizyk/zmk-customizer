import type { Project } from '@domain';
import { MarqueeLayer, WorkSurface } from '@ui/canvas/components';
import type { Marquee } from '@ui/canvas/components';
import type { ContentView, SurfaceContent } from '@ui/canvas/logic';
import {
  formatBindingLegend,
  formatKeycapLabel,
  formatKeycapTag,
  formatKeycapTitle,
  formatKeycapCorner,
} from '@ui/bindings/formatting';
import { KeycapShape } from './keycap-shape';
import { WiresBackdrop } from './wires-backdrop';
import type { KeyboardEvent, ReactNode } from 'react';

type BindingsCanvasProps = {
  readonly project: Project;
  /** The open layer (spec 007 FR-007). */
  readonly layerIndex: number;
  readonly selectedKeyIds: readonly string[];
  readonly activeKeyId: string | undefined;
  readonly marquee: Marquee | undefined;
  readonly problemsByKeyId: ReadonlyMap<string, readonly string[]>;
  readonly pointerHandlers: Pick<
    Extract<SurfaceContent, { readonly kind?: 'svg' }>,
    'onPointerDown' | 'onPointerMove' | 'onPointerUp' | 'onPointerCancel'
  >;
  readonly onKeycapSize: (keyId: string) => void;
  readonly onKeyFocus: (keyId: string) => void;
  readonly onKeyKeyDown: (keyId: string, event: KeyboardEvent<SVGGElement>) => void;
  /** The Action panel overlay. */
  readonly children?: ReactNode;
};

// Below this zoom legends are unreadable; the keycaps and the Keys table stay (contracts/ui.md).
const LEGEND_MIN_ZOOM = 0.4;

function Keycaps(props: BindingsCanvasProps & { readonly view: ContentView }) {
  const { project, layerIndex, selectedKeyIds, activeKeyId, problemsByKeyId, view } = props;
  return project.keys.map((key, keyIndex) => {
    const encoder = project.encoders.find((entry) => entry.pushKeyId === key.id);
    const binding = project.layers[layerIndex]?.bindings[key.id];
    const isSelected = selectedKeyIds.includes(key.id);
    const problems = problemsByKeyId.get(key.id) ?? [];
    const legend =
      view.zoom < LEGEND_MIN_ZOOM
        ? undefined
        : formatBindingLegend(binding, project.layers, project);
    return (
      <KeycapShape
        bindingKey={key}
        {...(encoder === undefined ? {} : { encoder })}
        corner={formatKeycapCorner(binding, legend?.tap)}
        hasConflict={problems.length > 0}
        isActive={key.id === activeKeyId}
        isSelected={isSelected}
        key={key.id}
        keyIndex={keyIndex}
        issuePath={`layers.${layerIndex}.bindings.${key.id}`}
        label={getKeycapLabel(project, { keyIndex, layerIndex, binding, isSelected, problems })}
        legend={legend}
        tag={legend === undefined ? undefined : formatKeycapTag(binding)}
        onKeycapSize={props.onKeycapSize}
        onFocus={props.onKeyFocus}
        onKeyDown={props.onKeyKeyDown}
        title={formatKeycapTitle(binding, project.layers, project)}
      />
    );
  });
}

function getKeycapLabel(
  project: Project,
  input: {
    readonly keyIndex: number;
    readonly layerIndex: number;
    readonly binding: Project['layers'][number]['bindings'][string] | undefined;
    readonly isSelected: boolean;
    readonly problems: readonly string[];
  },
) {
  return formatKeycapLabel({
    ...input,
    layerName: project.layers[input.layerIndex]?.name ?? '',
    layers: project.layers,
    behaviors: project.behaviors,
    macros: project.macros,
  });
}

export function BindingsCanvas(props: BindingsCanvasProps) {
  const { project, marquee, pointerHandlers, children } = props;
  const content: SurfaceContent = {
    ...pointerHandlers,
    label: `Bindings canvas, ${project.keys.length} keys. Right-click a keycap or press Shift+F10 for Keycap size. The Keys table below lists every key with its action.`,
    render: (view) => (
      <>
        <WiresBackdrop project={project} view={view} />
        <Keycaps {...props} view={view} />
        <MarqueeLayer marquee={marquee} />
      </>
    ),
  };
  return (
    <WorkSurface content={content} workspaceId="bindings">
      {children}
    </WorkSurface>
  );
}
