import * as z from 'zod';
import { getControllerBoard } from '../catalog/get-controller-board';

const pointSchema = z.strictObject({ xU: z.number(), yU: z.number() });
const oldEndSchema = z.discriminatedUnion('kind', [
  z.strictObject({ kind: z.literal('key-pin'), keyId: z.string(), pin: z.literal([1, 2]) }),
  z.strictObject({ kind: z.literal('junction'), wireId: z.string(), at: pointSchema }),
  z.strictObject({
    kind: z.literal('free'),
    at: pointSchema,
    boardPin: z.int().min(0).max(31).exactOptional(),
  }),
]);
const oldProjectSchema = z
  .object({
    schemaVersion: z.literal(4),
    controllerId: z.never().exactOptional(),
    wires: z.array(
      z.strictObject({
        id: z.string(),
        start: oldEndSchema,
        end: oldEndSchema,
        bends: z.array(pointSchema),
      }),
    ),
  })
  .loose();

function migrateEnd(end: z.infer<typeof oldEndSchema>) {
  if (end.kind !== 'free' || end.boardPin === undefined) {
    return end;
  }
  const board = getControllerBoard('nice_nano_v2');
  const pin = board.pins.find(
    (entry) => entry.mcu === `P0.${String(end.boardPin).padStart(2, '0')}`,
  );
  return pin === undefined
    ? { kind: 'free' as const, at: end.at, droppedBoardPin: `${board.name} P${end.boardPin}` }
    : { ...end, boardPin: pin.index };
}

export function migrateV4ToV5(data: unknown): unknown {
  const parsed = oldProjectSchema.safeParse(data);
  if (!parsed.success) {
    return data;
  }
  return {
    ...parsed.data,
    schemaVersion: 5,
    controllerId: 'nice_nano_v2',
    wires: parsed.data.wires.map((wire) => ({
      id: wire.id,
      bends: wire.bends,
      start: migrateEnd(wire.start),
      end: migrateEnd(wire.end),
    })),
  };
}
