import type { KeyboardEvent } from 'react';
import type { Crossing, Project, WirePoint } from '@domain';
import type { Marquee, ContentView } from '@ui/canvas';
import type { SchematicMarks } from './schematic-marks';
import type { SchematicSelection } from '../interaction/schematic-selection';

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
