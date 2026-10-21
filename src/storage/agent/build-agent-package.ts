import { DEFAULT_CONTROLLER_ID, getControllerBoard } from '@catalog/controllers';
import { SHIELD_TARGET } from '@catalog/firmware';
import { getAgentCatalogs } from './get-agent-catalogs';
import { KEYBOARD_PRESETS } from '@catalog/presets';
import { createLayoutPresetProject } from '@domain/project';
import { editWiring } from '@domain/wiring/editing';
import { CURRENT_SCHEMA_VERSION } from '@storage/migrations';
import { getProjectJsonSchema, serializeProject } from '@storage/project';
import { AGENT_GUIDE, AGENT_PROMPT } from './agent-instructions';

const EXAMPLE_IDS = ['macropad-9', 'corne-42'] as const;

export function buildAgentPackage(): readonly {
  readonly path: string;
  readonly content: string;
}[] {
  return [
    { path: 'README.md', content: getReadme() },
    { path: 'PROMPT.md', content: AGENT_PROMPT },
    { path: 'GUIDE.md', content: AGENT_GUIDE },
    toJsonFile('manifest.json', {
      packageVersion: 1,
      schemaVersion: CURRENT_SCHEMA_VERSION,
      zmkVersion: SHIELD_TARGET.zmkVersion,
      examples: EXAMPLE_IDS.map((id) => `examples/${id}.json`),
    }),
    toJsonFile('project.schema.json', getProjectJsonSchema()),
    toJsonFile('catalogs.json', getAgentCatalogs()),
    ...EXAMPLE_IDS.map((id) => createExample(id)),
  ];
}

function toJsonFile(path: string, value: unknown) {
  return { path, content: `${JSON.stringify(value, null, 2)}\n` };
}

function createExample(id: (typeof EXAMPLE_IDS)[number]) {
  const preset = KEYBOARD_PRESETS.find((entry) => entry.id === id);
  if (preset === undefined) {
    throw new Error(`Missing agent example preset: ${id}`);
  }
  const project = createLayoutPresetProject({
    preset,
    controllerId: DEFAULT_CONTROLLER_ID,
    bindingMode: 'qwerty',
  });
  const wired = editWiring(project, {
    kind: 'auto',
    board: getControllerBoard(project.controllerId),
    gridStepU: 1,
  });
  if (!wired.ok) {
    throw new Error(`Agent example wiring: ${wired.error}`);
  }
  const serialized = serializeProject(wired.value);
  if (!serialized.ok) {
    throw new Error(`Agent example format: ${serialized.error}`);
  }
  return { path: `examples/${id}.json`, content: serialized.value };
}

function getReadme() {
  return `# ZMK Customizer agent package

Package format 1; Project schema ${CURRENT_SCHEMA_VERSION}; ZMK ${SHIELD_TARGET.zmkVersion}.

1. Unzip and attach all files to your own AI agent. Read PROMPT.md and append your
   keyboard description. Ask the agent to read GUIDE.md, project.schema.json,
   catalogs.json, manifest.json and the examples before creating project.json.
2. Supply missing hardware facts or explicitly approve proposed choices. Review
   proposed pins and diodes against actual hardware; examples are illustrative.
3. Save your current Customizer project. Open the returned Project JSON with the
   normal Open action and confirm replacement. Review Problems, Schematic,
   Bindings and Firmware, repair issues, then preview and download from Export.

PROMPT.md is the ready instruction; GUIDE.md explains semantic rules and repair.
project.schema.json and catalogs.json are derived from this application's current
sources. manifest.json identifies compatibility. examples/macropad-9.json is a
complete unibody matrix; examples/corne-42.json is a complete BLE split matrix.
Their pins are examples, not a claim about your physical keyboard.

The structural schema cannot encode every importer refinement or domain/electrical
rule. The app's importer and export validation remain authoritative. Import
success does not prove firmware compilation or hardware operation. If output is
rejected, give the agent the field paths/messages and retry, or download a fresh
package after upgrading the app. Existing-project editing and MCP are not included.

This package contains built-in knowledge and examples only, with no current project
or browser preferences. It works offline; the app does not run AI or send data to
an AI provider. Your chosen agent environment determines where you share files.
`;
}
