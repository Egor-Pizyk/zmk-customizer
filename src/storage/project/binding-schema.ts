import * as z from 'zod';
import { MODIFIERS } from '@domain';
import { PROJECT_BUDGET } from './project-budget';

export const modifierSchema = z.enum(MODIFIERS);

// Unique and in MODIFIERS order, so equal bindings are deep-equal (spec 004 contracts/project-schema.md).
export const keyStrokeSchema = z.strictObject({
  keycode: z.string().min(1).max(PROJECT_BUDGET.stringLength),
  modifiers: z
    .array(modifierSchema)
    .refine(
      (modifiers) =>
        modifiers.every(
          (modifier, index) =>
            index === 0 ||
            MODIFIERS.indexOf(modifier) > MODIFIERS.indexOf(modifiers[index - 1] ?? modifier),
        ),
      { message: 'Expected unique modifiers in the order LC LS LA LG RC RS RA RG' },
    ),
});

export const layerIdSchema = z
  .string()
  .max(PROJECT_BUDGET.idLength)
  .regex(/^l\d+$/u);

// Unknown keycodes and profiles beyond the profile count are validation issues, not schema
// errors, so such a file still opens (spec 004 research R7).
// z.union, not discriminatedUnion: `bt` has two shapes under one kind. A failing binding is
// reported at its own path (layers.L.bindings.keyId).
export const behaviorParameterSchema = z.discriminatedUnion('kind', [
  z.strictObject({ kind: z.literal('key'), key: keyStrokeSchema }),
  z.strictObject({ kind: z.literal('layer'), layerId: layerIdSchema }),
  z.strictObject({ kind: z.literal('dummy') }),
]);
export const bindingSchema = z.union([
  z.strictObject({
    kind: z.literal('macro'),
    macroId: z
      .string()
      .regex(/^m\d+$/u)
      .max(PROJECT_BUDGET.idLength),
  }),
  z.strictObject({
    kind: z.literal('custom'),
    behaviorId: z
      .string()
      .regex(/^b\d+$/u)
      .max(PROJECT_BUDGET.idLength),
    parameters: z.array(behaviorParameterSchema).max(2),
  }),
  z.strictObject({ kind: z.literal(['kp', 'sk', 'kt']), key: keyStrokeSchema }),
  z.strictObject({ kind: z.literal('mt'), hold: keyStrokeSchema, tap: keyStrokeSchema }),
  z.strictObject({
    kind: z.literal([
      'trans',
      'none',
      'caps_word',
      'key_repeat',
      'gresc',
      'sys_reset',
      'bootloader',
    ]),
  }),
  z.strictObject({
    kind: z.literal('bt'),
    command: z.enum(['BT_CLR', 'BT_CLR_ALL', 'BT_NXT', 'BT_PRV']),
  }),
  z.strictObject({
    kind: z.literal('bt'),
    command: z.enum(['BT_SEL', 'BT_DISC']),
    profile: z.int().min(0),
  }),
  z.strictObject({ kind: z.literal('out'), command: z.enum(['OUT_TOG', 'OUT_USB', 'OUT_BLE']) }),
  z.strictObject({
    kind: z.literal('tap_dance'),
    taps: z.array(keyStrokeSchema).min(1).max(PROJECT_BUDGET.taps),
    tappingTermMs: z.int(),
  }),
  z.strictObject({
    kind: z.literal('mod_morph'),
    normal: keyStrokeSchema,
    morphed: keyStrokeSchema,
    mods: z
      .array(modifierSchema)
      .min(1)
      .refine(
        (mods) =>
          mods.every(
            (modifier, index) =>
              index === 0 ||
              MODIFIERS.indexOf(modifier) > MODIFIERS.indexOf(mods[index - 1] ?? modifier),
          ),
        { message: 'Expected unique modifiers in the order LC LS LA LG RC RS RA RG' },
      ),
  }),
  z.strictObject({ kind: z.literal(['mo', 'tog', 'to', 'sl']), layerId: layerIdSchema }),
  z.strictObject({ kind: z.literal('lt'), layerId: layerIdSchema, tap: keyStrokeSchema }),
]);
