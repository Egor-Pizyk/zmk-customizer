import { expect, it } from 'vitest';
import { buildAgentPackage } from '@storage/agent';
import { parseProjectFile } from '@storage/project';
import { getControllerBoard } from '@catalog/controllers';
import { FIRMWARE_OPTIONS, SHIELD_TARGET } from '@catalog/firmware';
import { BINDINGS_CATALOG } from '@catalog/bindings';
import { analyzeProject } from '@domain/analysis';
import { generateRepositoryFiles } from '@generators/repository';
import { getResultValue } from '../../../helpers/result';

function contentAt(path: string) {
  const file = buildAgentPackage().find((entry) => entry.path === path);
  if (file === undefined) {
    throw new Error(`Missing ${path}`);
  }
  return file.content;
}

it.each([
  ['macropad-9', 9, 1],
  ['corne-42', 42, 2],
] as const)(
  'includes a complete importable and exportable %s example',
  (id, keyCount, halfCount) => {
    const project = getResultValue(parseProjectFile(contentAt(`examples/${id}.json`)));
    const board = getControllerBoard(project.controllerId);
    const target = { ...SHIELD_TARGET, ...board, boardId: board.id };
    const analysis = analyzeProject(project, {
      target,
      board,
      firmwareOptions: FIRMWARE_OPTIONS,
      bindingsCatalog: BINDINGS_CATALOG,
    });
    expect(project.keys).toHaveLength(keyCount);
    expect(Object.keys(getBaseBindings(project.layers))).toHaveLength(keyCount);
    expect(project.wires.length).toBeGreaterThan(0);
    expect(analysis.issues).toEqual([]);
    const files = generateRepositoryFiles(project, {
      matrix: getResultValue(analysis.matrix),
      target,
      includeWorkflow: true,
    });
    expect(hasKeymap(files)).toBe(true);
    expect(getOverlays(files)).toHaveLength(halfCount);
    expect(getBuildContent(files)).toContain('nice_nano_v2');
  },
);

function getBaseBindings(layers: readonly { readonly bindings: unknown }[]) {
  return layers[0]?.bindings ?? {};
}
function getBuildContent(files: readonly { readonly path: string; readonly content: string }[]) {
  return files.find((file) => file.path === 'build.yaml')?.content;
}

function hasKeymap(files: readonly { readonly path: string; readonly content: string }[]) {
  return files.some((file) => file.path.endsWith('.keymap') && file.content.includes('&kp'));
}
function getOverlays(files: readonly { readonly path: string }[]) {
  return files.filter((file) => file.path.endsWith('.overlay') && !file.path.includes('/boards/'));
}
