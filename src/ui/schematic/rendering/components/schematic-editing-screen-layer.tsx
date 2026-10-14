import { KeyTransformFrames } from './key-transform-frames';
import { SchematicScreenLayer } from './schematic-screen-layer';
import type { SchematicSelection } from '@ui/schematic/interaction';

type EditingScreenLayerProps = Parameters<typeof SchematicScreenLayer>[0] & {
  readonly hasTransformFrames: boolean;
  readonly selection: SchematicSelection;
};

export function SchematicEditingScreenLayer(props: EditingScreenLayerProps) {
  return (
    <>
      <SchematicScreenLayer {...props} />
      {props.hasTransformFrames ? (
        <KeyTransformFrames project={props.project} view={props.view} selection={props.selection} />
      ) : null}
    </>
  );
}
