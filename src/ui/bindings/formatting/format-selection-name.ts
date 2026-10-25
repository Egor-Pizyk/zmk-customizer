import type { Project } from '@domain';

/** "Key 12" or "3 keys", for the panel header and status messages. */
export function formatSelectionName(project: Project, keyIds: readonly string[]): string {
  const [keyId] = keyIds;
  if (keyIds.length !== 1 || keyId === undefined) {
    return `${keyIds.length} keys`;
  }
  const encoderIndex = project.encoders.findIndex((encoder) => encoder.pushKeyId === keyId);
  return encoderIndex === -1
    ? `Key ${project.keys.findIndex((key) => key.id === keyId)}`
    : `Encoder ${encoderIndex} push`;
}
