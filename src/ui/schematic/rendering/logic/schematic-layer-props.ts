import type { Crossing } from '@domain/crossings';
import type { Project, WirePoint } from '@domain';
import type { Marquee } from '@ui/canvas/components';
import type { ContentView } from '@ui/canvas/logic';
import type { SchematicMarks } from './schematic-marks';
import type { SchematicSelection } from '@ui/schematic/interaction';
import type { KeyboardEvent } from 'react';

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
