# Contract: Project schema v3

Extends `specs/003-schematic-switches-wires/contracts/project-schema.md`. Only the differences are listed here.

- `schemaVersion: z.literal(3)`; `CURRENT_SCHEMA_VERSION = 3`; `MIGRATIONS = [undefined, migrateV1ToV2, migrateV2ToV3]`.
- New top-level field `layers`: `z.array(layerSchema).min(1)`.

```ts
const modifierSchema = z.enum(['LC', 'LS', 'LA', 'LG', 'RC', 'RS', 'RA', 'RG']);
const keyStrokeSchema = z.object({ keycode: z.string().min(1), modifiers: z.array(modifierSchema) });
// + refine: modifiers unique and in union order (so equal bindings are deep-equal)

const bindingSchema = z.union([
  z.object({ kind: z.literal('kp'), key: keyStrokeSchema }),
  z.object({ kind: z.literal('mt'), hold: keyStrokeSchema, tap: keyStrokeSchema }),
  z.object({ kind: z.literal('sk'), key: keyStrokeSchema }),
  z.object({ kind: z.literal('kt'), key: keyStrokeSchema }),
  z.object({ kind: z.enum(['trans', 'none', 'caps_word', 'key_repeat', 'gresc', 'sys_reset', 'bootloader']) }),
  z.object({ kind: z.literal('bt'), command: z.enum(['BT_CLR', 'BT_CLR_ALL', 'BT_NXT', 'BT_PRV']) }),
  z.object({ kind: z.literal('bt'), command: z.enum(['BT_SEL', 'BT_DISC']), profile: z.int().min(0) }),
  z.object({ kind: z.literal('out'), command: z.enum(['OUT_TOG', 'OUT_USB', 'OUT_BLE']) }),
]); // z.strictObject for each: extra fields reject (R7)

const layerSchema = z.strictObject({
  id: z.string().regex(/^l\d+$/u),
  name: z.string(),
  bindings: z.record(z.string(), bindingSchema),
});
```

`superRefine` additions (rejections, paths as zod issue paths):

| Check | Path | Message |
|---|---|---|
| Duplicate layer id | `['layers', L, 'id']` | `Duplicate id l0` |
| Binding for a key id that does not exist | `['layers', L, 'bindings', keyId]` | `No key with id k7` |

Not checked by the schema; reported by `validateBindings` instead (contracts/validation-issues.md): unknown keycode names and profile ≥ 5.

Round trip: `parseProjectFile(serializeProject(project))` deep-equals `project` for every v3 project. The same holds for autosave. The schema is `satisfies z.ZodType<Project>`, so types and schema cannot drift.
