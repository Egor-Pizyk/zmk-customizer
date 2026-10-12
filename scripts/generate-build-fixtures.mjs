import { createServer } from 'vite';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
const directory = '.zmk-build/exports';
const server = await createServer({ server: { middlewareMode: true } });
try {
  const { UNIBODY_PRESET } = await server.ssrLoadModule('/src/catalog/unibody-preset.ts');
  const { CONTROLLER_BOARDS } = await server.ssrLoadModule('/src/catalog/controller-boards.ts');
  const { BINDINGS_CATALOG } = await server.ssrLoadModule('/src/catalog/bindings-catalog.ts');
  const { SHIELD_TARGET } = await server.ssrLoadModule('/src/catalog/shield-target.ts');
  const { validateShieldProject } = await server.ssrLoadModule(
    '/src/domain/validate-shield-project.ts',
  );
  const { deriveShieldMatrix } = await server.ssrLoadModule('/src/domain/derive-shield-matrix.ts');
  const { generateRepositoryFiles } = await server.ssrLoadModule(
    '/src/generators/generate-repository-files.ts',
  );
  await rm(directory, { recursive: true, force: true });
  const targets = [];
  const oldPins = [
    ...new Set(
      UNIBODY_PRESET.wires.flatMap((wire) =>
        [wire.start, wire.end].flatMap((end) => (end.boardPin === undefined ? [] : [end.boardPin])),
      ),
    ),
  ].toSorted((first, second) => first - second);
  for (const board of CONTROLLER_BOARDS) {
    for (const direction of ['col2row', 'row2col']) {
      const pins = new Map(oldPins.map((pin, index) => [pin, board.gpioPins[index]]));
      const project = {
        ...structuredClone(UNIBODY_PRESET),
        controllerId: board.id,
        keys: UNIBODY_PRESET.keys.map((key) => ({
          ...key,
          diode: { pin: 1, cathode: direction === 'col2row' ? 'away-switch' : 'toward-switch' },
        })),
        wires: UNIBODY_PRESET.wires.map((wire) => ({
          ...wire,
          ...Object.fromEntries(
            ['start', 'end'].map((side) => [
              side,
              wire[side].boardPin === undefined
                ? wire[side]
                : { ...wire[side], boardPin: pins.get(wire[side].boardPin) },
            ]),
          ),
        })),
        layers: UNIBODY_PRESET.layers.map((layer) => ({
          ...layer,
          bindings: Object.fromEntries(
            Object.entries(layer.bindings).map(([keyId, binding]) => [
              keyId,
              !board.ble && binding.kind === 'bt' ? { kind: 'none' } : binding,
            ]),
          ),
        })),
      };
      const target = { ...SHIELD_TARGET, ...board, boardId: board.id };
      assert.deepEqual(
        validateShieldProject(project, { board, target, bindingsCatalog: BINDINGS_CATALOG }),
        [],
      );
      const matrix = deriveShieldMatrix(project, target);
      assert.equal(matrix.ok, true);
      assert.equal(matrix.value.diodeDirection, direction);
      const files = generateRepositoryFiles(project, {
        matrix: matrix.value,
        target,
        includeWorkflow: false,
      });
      assert.deepEqual(
        files,
        generateRepositoryFiles(project, { matrix: matrix.value, target, includeWorkflow: false }),
      );
      const id = `${board.id}-${direction}`;
      for (const file of files) {
        const destination = path.join(directory, id, file.path);
        await mkdir(path.dirname(destination), { recursive: true });
        await writeFile(destination, file.content);
      }
      targets.push({ id, board: board.id, shield: project.shieldName });
    }
  }
  assert.equal(targets.length, 8);
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, 'targets.json'), `${JSON.stringify(targets, null, 2)}\n`);
  process.stdout.write(`Generated ${targets.length} deterministic actual-export build targets\n`);
} finally {
  await server.close();
}
