import * as z from 'zod';
import type { CustomBehavior } from '@domain';
import { bindingSchema, modifierSchema } from './binding-schema';
import { PROJECT_BUDGET } from './project-budget';

const identity = {
  id: z
    .string()
    .regex(/^b\d+$/u)
    .max(PROJECT_BUDGET.idLength),
  name: z.string().max(160),
};
const target = z.enum([
  'kp',
  'sk',
  'kt',
  'mo',
  'tog',
  'to',
  'sl',
  'none',
  'trans',
  'caps_word',
  'key_repeat',
  'gresc',
  'sys_reset',
  'bootloader',
]);
export const customBehaviorSchema = z.discriminatedUnion('kind', [
  z.strictObject({
    ...identity,
    kind: z.literal('hold-tap'),
    holdBehavior: target,
    tapBehavior: target,
    flavor: z.enum(['hold-preferred', 'balanced', 'tap-preferred', 'tap-unless-interrupted']),
    tappingTermMs: z.int(),
    quickTapMs: z.int(),
    requirePriorIdleMs: z.int(),
    retroTap: z.boolean(),
    holdWhileUndecided: z.boolean(),
    holdWhileUndecidedLinger: z.boolean(),
    holdTriggerOnRelease: z.boolean(),
    triggerKeyIds: z
      .array(
        z
          .string()
          .regex(/^k\d+$/u)
          .max(PROJECT_BUDGET.idLength),
      )
      .max(256),
  }),
  z.strictObject({
    ...identity,
    kind: z.literal('tap-dance'),
    bindings: z
      .array(
        z.strictObject({
          id: z
            .string()
            .regex(/^a\d+$/u)
            .max(PROJECT_BUDGET.idLength),
          binding: bindingSchema,
        }),
      )
      .max(32)
      .refine(
        (actions) => new Set(actions.map((action) => action.id)).size === actions.length,
        'Action IDs must be unique',
      ),
    tappingTermMs: z.int(),
  }),
  z.strictObject({
    ...identity,
    kind: z.literal('mod-morph'),
    normal: bindingSchema,
    morphed: bindingSchema,
    mods: z.array(modifierSchema).max(8),
    keepMods: z.array(modifierSchema).max(8),
  }),
  z.strictObject({
    ...identity,
    kind: z.literal(['sticky-key', 'sticky-layer']),
    releaseAfterMs: z.int(),
    quickRelease: z.boolean(),
    lazy: z.boolean(),
    ignoreModifiers: z.boolean(),
  }),
]) satisfies z.ZodType<CustomBehavior>;
