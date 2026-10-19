import * as z from 'zod';
import { encoderSchema } from './encoder-schema';
import { comboSchema, macroSchema, conditionalLayerSchema } from './advanced-keymap-schema';
import { customBehaviorSchema } from './custom-behavior-schema';
import { firmwareSchema } from './firmware-schema';

export const projectContentSchema = z.object({
  encoders: z.array(encoderSchema).max(16),
  combos: z.array(comboSchema).max(128),
  macros: z.array(macroSchema).max(128),
  conditionalLayers: z.array(conditionalLayerSchema).max(128),
  behaviors: z.array(customBehaviorSchema).max(128),
  firmware: firmwareSchema,
});
