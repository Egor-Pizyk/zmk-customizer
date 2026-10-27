import type { CanvasHit } from '@ui/schematic/interaction';
import type { ContentView } from '@ui/canvas/logic';

export type DiagramMarkup = {
  readonly tagName: string;
  readonly selector?: string;
  readonly attributes?: Readonly<Record<string, string | number | boolean>>;
  readonly children?: readonly DiagramMarkup[];
};

export type DiagramCell = {
  readonly id: string;
  readonly reference?: CanvasHit;
  readonly markup: readonly DiagramMarkup[];
  readonly attributes: Readonly<
    Record<string, Readonly<Record<string, string | number | boolean>>>
  >;
};

export type DiagramInput = {
  readonly cells: readonly DiagramCell[];
  readonly view: ContentView;
};

export type Diagram = {
  readonly kind: 'ready';
  readonly sync: (input: DiagramInput) => boolean;
  readonly dispose: () => void;
};

export type DiagramResult = Diagram | { readonly kind: 'unavailable' };
