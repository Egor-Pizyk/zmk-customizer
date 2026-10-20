import * as z from 'zod';
import { encoderBindingsSchema } from './encoder-schema';
import { bindingSchema, layerIdSchema } from './binding-schema';
import { PROJECT_BUDGET } from './project-budget';

export const layerSchema = z.strictObject({
  encoderBindings: encoderBindingsSchema.exactOptional(),
  id: layerIdSchema,
  name: z.string().max(PROJECT_BUDGET.stringLength),
  bindings: z.record(z.string(), bindingSchema),
});
