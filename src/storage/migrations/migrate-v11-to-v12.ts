import * as z from 'zod';
import { captureWireContacts, shareWireContacts } from '@domain/wires';

const point = z.strictObject({ xU: z.number(), yU: z.number() });
const key = z
  .object({
    id: z.string(),
    xU: z.number(),
    yU: z.number(),
    widthU: z.number().exactOptional(),
    heightU: z.number().exactOptional(),
    rotationDeg: z.number().exactOptional(),
    rotationOriginXU: z.number().exactOptional(),
    rotationOriginYU: z.number().exactOptional(),
  })
  .loose();
const end = z.discriminatedUnion('kind', [
  z.strictObject({ kind: z.literal('key-pin'), keyId: z.string(), pin: z.literal([1, 2]) }),
  z.strictObject({ kind: z.literal('junction'), wireId: z.string(), at: point }),
  z.strictObject({
    kind: z.literal('free'),
    at: point,
    boardPin: z.number().exactOptional(),
    terminalId: z.string().exactOptional(),
    droppedBoardPin: z.string().exactOptional(),
  }),
]);
const previous = z
  .object({
    schemaVersion: z.literal(11),
    keys: z.array(key),
    wires: z.array(z.strictObject({ id: z.string(), start: end, end, bends: z.array(point) })),
  })
  .loose();

/** Full legacy validation occurs at parseProjectFile before migrations enter geometry. */
export function migrateV11ToV12(data: unknown): unknown {
  const parsed = previous.safeParse(data);
  if (!parsed.success) {
    return data;
  }
  const project = parsed.data;
  const hasDanglingPin = project.wires.some((wire) =>
    [wire.start, wire.end].some(
      (endpoint) =>
        endpoint.kind === 'key-pin' && !project.keys.some((entry) => entry.id === endpoint.keyId),
    ),
  );
  if (hasDanglingPin) {
    return data;
  }
  return {
    ...project,
    schemaVersion: 12,
    ...shareWireContacts(project.wires.map((wire) => captureWireContacts(project, wire))),
  };
}
