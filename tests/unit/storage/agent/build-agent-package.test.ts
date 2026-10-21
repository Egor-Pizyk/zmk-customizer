import { expect, it } from 'vitest';
import { buildAgentPackage } from '@storage/agent';
import { getProjectJsonSchema } from '@storage/project';
import { CURRENT_SCHEMA_VERSION } from '@storage/migrations';
import { CONTROLLER_BOARDS, WIRING_OPTIONS } from '@catalog/controllers';
import {
  BEHAVIORS,
  KEYCODES,
  MODIFIER_BITS,
  MODIFIER_KEYCODES,
  BLUETOOTH_COMMANDS,
  BLUETOOTH_PROFILE_COUNT,
  OUTPUT_COMMANDS,
  CUSTOM_BEHAVIOR_TYPES,
  CUSTOM_BEHAVIOR_PROPERTIES,
  HOLD_TAP_TARGETS,
  HOLD_TAP_FLAVORS,
  MACRO_OPTIONS,
  MACRO_STEP_KINDS,
  ADVANCED_OPTIONS,
  BINDINGS_CATALOG,
} from '@catalog/bindings';
import { FIRMWARE_OPTIONS, SHIELD_TARGET, ZMK_LIMITS } from '@catalog/firmware';
import { ENCODER_DEFAULTS, ENCODER_LIMITS, ENCODER_OPTIONS } from '@catalog/encoders';
import { buildExportZip } from '@storage/export';
import { unzipSync, strFromU8 } from 'fflate';

function contentAt(path: string) {
  const file = buildAgentPackage().find((entry) => entry.path === path);
  if (file === undefined) {
    throw new Error(`Missing ${path}`);
  }
  return file.content;
}

it('publishes current versions, structural schema and exact catalog data without user inputs', () => {
  const manifest: unknown = JSON.parse(contentAt('manifest.json'));
  expect(manifest).toEqual({
    packageVersion: 1,
    schemaVersion: CURRENT_SCHEMA_VERSION,
    zmkVersion: SHIELD_TARGET.zmkVersion,
    examples: ['examples/macropad-9.json', 'examples/corne-42.json'],
  });
  const schema: unknown = JSON.parse(contentAt('project.schema.json'));
  expect(schema).toEqual(getProjectJsonSchema());
  expect(schema).toMatchObject({
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    properties: {
      schemaVersion: { const: CURRENT_SCHEMA_VERSION },
      controllerId: { enum: CONTROLLER_BOARDS.map((board) => board.id) },
      keys: { maxItems: 512 },
    },
  });
  const catalogs: unknown = JSON.parse(contentAt('catalogs.json'));
  expect(catalogs).toMatchObject({
    controllers: CONTROLLER_BOARDS,
    keycodes: KEYCODES,
    modifiers: MODIFIER_BITS,
    behaviors: BEHAVIORS,
    firmware: FIRMWARE_OPTIONS,
    wiring: WIRING_OPTIONS,
    modifierKeycodes: MODIFIER_KEYCODES,
    bluetoothCommands: BLUETOOTH_COMMANDS,
    bluetoothProfileCount: BLUETOOTH_PROFILE_COUNT,
    outputCommands: OUTPUT_COMMANDS,
    customBehaviorTypes: CUSTOM_BEHAVIOR_TYPES,
    customBehaviorProperties: CUSTOM_BEHAVIOR_PROPERTIES,
    holdTapTargets: HOLD_TAP_TARGETS,
    holdTapFlavors: HOLD_TAP_FLAVORS,
    macros: { options: MACRO_OPTIONS, stepKinds: MACRO_STEP_KINDS },
    advanced: { options: ADVANCED_OPTIONS, limits: BINDINGS_CATALOG.advancedLimits },
    encoders: { defaults: ENCODER_DEFAULTS, limits: ENCODER_LIMITS, options: ENCODER_OPTIONS },
    limits: { project: { keys: 512, bytes: 5 * 1024 * 1024 }, zmk: ZMK_LIMITS },
    geometry: {
      unitKeyPins: [
        { xU: 0.3, yU: 0.3667 },
        { xU: 0.6333, yU: 0.2333 },
      ],
    },
  });
});

it('contains self-contained creation, hardware agreement and safe repair guidance', () => {
  const prompt = contentAt('PROMPT.md');
  expect(prompt).toContain('Ask');
  expect(prompt).toContain('explicit approval');
  expect(prompt).toContain('Project JSON');
  expect(prompt).toContain('existing project');
  const guide = contentAt('GUIDE.md');
  for (const phrase of [
    'terminalId',
    'contactIds',
    'half',
    'firmware',
    'Problems',
    'Open',
    'Undo',
    'firmware compilation',
  ]) {
    expect(guide).toContain(phrase);
  }
  expect(contentAt('README.md')).toContain('Save');
});

it('downloads byte-identical self-contained files with no timestamps or user metadata', async () => {
  const first = buildAgentPackage();
  expect(buildAgentPackage()).toEqual(first);
  expect(first.map((file) => file.path).toSorted()).toEqual([
    'GUIDE.md',
    'PROMPT.md',
    'README.md',
    'catalogs.json',
    'examples/corne-42.json',
    'examples/macropad-9.json',
    'manifest.json',
    'project.schema.json',
  ]);
  for (const file of first) {
    expect(file.content.endsWith('\n')).toBe(true);
    expect(file.content).not.toContain('\r');
    expect(file.content).not.toMatch(/userAgent|localStorage|timestamp/u);
  }
  const bytes = await buildExportZip(first);
  expect(await buildExportZip(buildAgentPackage())).toEqual(bytes);
  const extracted = unzipSync(bytes);
  for (const file of first) {
    const entry = extracted[file.path];
    expect(decodeEntry(entry)).toBe(file.content);
  }
});

function decodeEntry(entry: Uint8Array | undefined) {
  return entry === undefined ? undefined : strFromU8(entry);
}
