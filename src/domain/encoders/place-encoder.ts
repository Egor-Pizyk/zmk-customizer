import { PROJECT_BUDGET } from '@domain/project';
import type { Project, WirePoint } from '@domain';
import { addEncoder } from './add-encoder';
import { replaceEncoder } from './replace-encoder';
import { setEncoderPushSwitch } from './set-encoder-push-switch';

export function placeEncoder(
  project: Project,
  input: {
    readonly position: WirePoint;
    readonly defaults: { readonly steps: number; readonly triggersPerRotation: number };
    readonly hasPushSwitch?: boolean;
  },
): Project {
  if (
    project.encoders.length >= 16 ||
    (input.hasPushSwitch !== false && project.keys.length >= PROJECT_BUDGET.keys)
  ) {
    return project;
  }
  const added = addEncoder(project, input.defaults);
  const encoder = added.encoders.at(-1);
  if (encoder === undefined) {
    return project;
  }
  const positioned = replaceEncoder(added, {
    ...encoder,
    ...input.position,
    wiringMode: 'schematic',
  });
  return input.hasPushSwitch === false
    ? positioned
    : setEncoderPushSwitch(positioned, { encoderId: encoder.id, enabled: true });
}
