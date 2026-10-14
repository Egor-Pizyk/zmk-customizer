import { createServer } from 'vite';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
const directory = '.zmk-build/exports';
const server = await createServer({ server: { middlewareMode: true } });
try {
  const { UNIBODY_PRESET } = await server.ssrLoadModule('/src/catalog/presets/index.ts');
  const { CONTROLLER_BOARDS } = await server.ssrLoadModule('/src/catalog/controllers/index.ts');
  const { BINDINGS_CATALOG } = await server.ssrLoadModule('/src/catalog/bindings/index.ts');
  const { SHIELD_TARGET } = await server.ssrLoadModule('/src/catalog/firmware/index.ts');
  const { validateShieldProject } = await server.ssrLoadModule(
    '/src/domain/validation/shield/index.ts',
  );
  const { deriveShieldMatrix } = await server.ssrLoadModule('/src/domain/wiring/matrix/index.ts');
  const { generateRepositoryFiles } = await server.ssrLoadModule(
    '/src/generators/repository/index.ts',
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
  const { createProject } = await server.ssrLoadModule('/src/domain/project/index.ts');
  const { getKeyPinPosition } = await server.ssrLoadModule('/src/domain/wires/index.ts');
  const board = CONTROLLER_BOARDS.find((candidate) => candidate.id === 'nice_nano_v2');
  assert.ok(board);
  for (const rotationDeg of [-15, 30]) {
    const key = {
      id: 'k0',
      xU: 0,
      yU: 0,
      widthU: 1.5,
      heightU: 2,
      rotationDeg,
      rotationOriginXU: 0.75,
      rotationOriginYU: 1,
      diode: { pin: 1, cathode: 'away-switch' },
    };
    const project = {
      ...createProject({ controllerId: board.id }),
      name: 'Layout test',
      shieldName: 'layout_test',
      keys: [key],
      wires: [1, 2].map((pin) => {
        const at = getKeyPinPosition(key, pin);
        return {
          id: `w${pin}`,
          start: { kind: 'key-pin', keyId: key.id, pin },
          end: {
            kind: 'free',
            at: { xU: pin === 1 ? -2 : 3, yU: at.yU },
            boardPin: pin === 1 ? 2 : 8,
          },
          bends: [],
        };
      }),
      layers: [
        {
          id: 'l0',
          name: 'Base',
          bindings: { k0: { kind: 'kp', key: { keycode: 'A', modifiers: [] } } },
        },
      ],
    };
    const target = { ...SHIELD_TARGET, ...board, boardId: board.id };
    assert.deepEqual(
      validateShieldProject(project, { board, target, bindingsCatalog: BINDINGS_CATALOG }),
      [],
    );
    const matrix = deriveShieldMatrix(project, target);
    assert.equal(matrix.ok, true);
    assert.deepEqual(matrix.value.cells, [{ row: 0, col: 0 }]);
    const files = generateRepositoryFiles(project, {
      matrix: matrix.value,
      target,
      includeWorkflow: false,
    });
    assert.deepEqual(
      files,
      generateRepositoryFiles(project, { matrix: matrix.value, target, includeWorkflow: false }),
    );
    const rotationCell = rotationDeg < 0 ? `(${rotationDeg * 100})` : String(rotationDeg * 100);
    assert.ok(
      files
        .find((file) => file.path.endsWith('.overlay'))
        .content.includes(`150 200 0 0 ${rotationCell} 75 100`),
    );
    const id = `layout-${rotationDeg < 0 ? 'negative' : 'positive'}-rotation`;
    for (const file of files) {
      const destination = path.join(directory, id, file.path);
      await mkdir(path.dirname(destination), { recursive: true });
      await writeFile(destination, file.content);
    }
    targets.push({ id, board: board.id, shield: project.shieldName });
  }
  assert.equal(targets.length, 10);
  const { editWiring } = await server.ssrLoadModule('/src/domain/wiring/editing/index.ts');
  for (const [kind, topology, direction] of [
    ['matrix', 'unibody', 'col2row'],
    ['matrix', 'unibody', 'row2col'],
    ['direct', 'unibody', 'col2row'],
    ['matrix', 'split', 'col2row'],
    ['matrix', 'split', 'row2col'],
    ['direct', 'split', 'col2row'],
  ]) {
    const apply = (project, input) => {
      const result = editWiring(project, { ...input, board });
      assert.equal(result.ok, true, result.error);
      return result.value;
    };
    let project = apply(UNIBODY_PRESET, { kind: 'initialize' });
    project = apply(project, { kind: 'mode', mode: kind });
    project = apply(project, { kind: 'topology', topology });
    project = apply(project, { kind: 'direction', direction });
    for (const half of ['left', 'right']) {
      const terminals = project.wiring.terminals.filter(
        (terminal) => terminal.half === half && terminal.kind !== 'ground',
      );
      for (const [index, terminal] of terminals.entries()) {
        project = apply(project, {
          kind: 'pin',
          terminalId: terminal.id,
          boardPin: board.gpioPins[index],
        });
      }
    }
    const target = { ...SHIELD_TARGET, ...board, boardId: board.id };
    assert.deepEqual(
      validateShieldProject(project, { board, target, bindingsCatalog: BINDINGS_CATALOG }),
      [],
    );
    const matrix = deriveShieldMatrix(project, target);
    assert.equal(matrix.ok, true);
    const files = generateRepositoryFiles(project, {
      matrix: matrix.value,
      target,
      includeWorkflow: false,
    });
    const baseId = `wiring-${kind}-${topology}-${direction}`;
    for (const suffix of topology === 'split' ? ['_left', '_right'] : ['']) {
      const id = `${baseId}${suffix}`;
      for (const file of files) {
        const destination = path.join(directory, id, file.path);
        await mkdir(path.dirname(destination), { recursive: true });
        await writeFile(destination, file.content);
      }
      targets.push({
        id,
        board: board.id,
        shield: `${project.shieldName ?? 'unibody_six'}${suffix}`,
      });
    }
  }
  assert.equal(targets.length, 19);
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, 'targets.json'), `${JSON.stringify(targets, null, 2)}\n`);
  process.stdout.write(`Generated ${targets.length} deterministic actual-export build targets\n`);
} finally {
  await server.close();
}
