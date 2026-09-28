import type { KeyboardEvent } from 'react';
import type { Crossing } from '../../domain/find-crossings';
import type { Project, WirePoint } from '../../domain/types';
import type { ContentView } from '../canvas/surface-content';
import type { SchematicMarks } from './schematic-marks';
import type { SchematicSelection } from './schematic-selection';

export type Marquee = {
  readonly start: WirePoint;
  readonly end: WirePoint;
};

export type SchematicLayerProps = {
  readonly project: Project;
  readonly view: ContentView;
  readonly paths: ReadonlyMap<string, readonly WirePoint[]>;
  readonly selection: SchematicSelection;
  readonly marquee: Marquee | undefined;
  readonly activeKeyId: string | undefined;
  readonly marks: SchematicMarks;
  readonly crossings: readonly Crossing[];
  readonly onKeyKeyDown: (keyId: string, event: KeyboardEvent<SVGGElement>) => void;
  readonly onKeyFocus: (keyId: string) => void;
};
