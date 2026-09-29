import type { KeyboardEvent, ReactNode } from 'react';
import type { Project } from '../../domain/types';
import { MarqueeLayer } from '../canvas/marquee-layer';
import type { Marquee } from '../canvas/marquee-layer';
import type { ContentView, SurfaceContent } from '../canvas/surface-content';
import { WorkSurface } from '../canvas/work-surface';
import { formatBindingLegend } from './format-binding-legend';
import { formatKeycapLabel, formatKeycapTitle } from './format-keycap-label';
import { formatKeycapCorner } from './format-keycap-corner';
import { KeycapShape } from './keycap-shape';
import { WiresBackdrop } from './wires-backdrop';

type BindingsCanvasProps = {
  readonly project: Project;
  readonly selectedKeyIds: readonly string[];
  readonly activeKeyId: string | undefined;
  readonly marquee: Marquee | undefined;
  readonly problemsByKeyId: ReadonlyMap<string, readonly string[]>;
  readonly pointerHandlers: Pick<
    SurfaceContent,
    'onPointerDown' | 'onPointerMove' | 'onPointerUp' | 'onPointerCancel'
  >;
  readonly onKeyFocus: (keyId: string) => void;
  readonly onKeyKeyDown: (keyId: string, event: KeyboardEvent<SVGGElement>) => void;
  /** The Action panel overlay. */
  readonly children?: ReactNode;
};

// Below this zoom legends are unreadable; the keycaps and the Keys table stay (contracts/ui.md).
const LEGEND_MIN_ZOOM = 0.4;

function Keycaps(props: BindingsCanvasProps & { readonly view: ContentView }) {
  const { project, selectedKeyIds, activeKeyId, problemsByKeyId, view } = props;
  const layer = project.layers[0];
  return project.keys.map((key, keyIndex) => {
    const binding = layer?.bindings[key.id];
    const isSelected = selectedKeyIds.includes(key.id);
    const problems = problemsByKeyId.get(key.id) ?? [];
    const legend = view.zoom < LEGEND_MIN_ZOOM ? undefined : formatBindingLegend(binding);
    return (
      <KeycapShape
        bindingKey={key}
        corner={formatKeycapCorner(binding, legend?.tap)}
        hasConflict={problems.length > 0}
        isActive={key.id === activeKeyId}
        isSelected={isSelected}
        key={key.id}
        keyIndex={keyIndex}
        label={formatKeycapLabel({
          keyIndex,
          layerName: layer?.name ?? '',
          binding,
          isSelected,
          problems,
        })}
        legend={legend}
        onFocus={props.onKeyFocus}
        onKeyDown={props.onKeyKeyDown}
        title={formatKeycapTitle(binding)}
      />
    );
  });
}

export function BindingsCanvas(props: BindingsCanvasProps) {
  const { project, marquee, pointerHandlers, children } = props;
  const content: SurfaceContent = {
    ...pointerHandlers,
    label: `Bindings canvas, ${project.keys.length} keys. The Keys table below lists every key with its action.`,
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
