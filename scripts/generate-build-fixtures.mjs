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
  const { FIRMWARE_OPTIONS } = await server.ssrLoadModule('/src/catalog/firmware/index.ts');
  const { validateFirmware } = await server.ssrLoadModule('/src/domain/firmware/index.ts');
  for (const topology of ['unibody', 'split']) {
    const apply = (project, input) => {
      const edited = editWiring(project, { ...input, board });
      assert.equal(edited.ok, true, edited.error);
      return edited.value;
    };
    let project = apply(UNIBODY_PRESET, { kind: 'initialize' });
    project = apply(project, { kind: 'mode', mode: topology === 'unibody' ? 'direct' : 'matrix' });
    project = apply(project, { kind: 'topology', topology });
    for (const half of ['left', 'right']) {
      for (const [index, terminal] of project.wiring.terminals
        .filter((item) => item.half === half && item.kind !== 'ground')
        .entries()) {
        project = apply(project, {
          kind: 'pin',
          terminalId: terminal.id,
          boardPin: board.gpioPins[index],
        });
      }
    }
    project = {
      ...project,
      firmware: {
        CONFIG_ZMK_SLEEP: true,
        CONFIG_ZMK_IDLE_SLEEP_TIMEOUT: 600000,
        CONFIG_ZMK_IDLE_TIMEOUT: 45000,
        CONFIG_ZMK_KSCAN_DEBOUNCE_PRESS_MS: 0,
        CONFIG_ZMK_HID_REPORT_TYPE: 'NKRO',
        CONFIG_USB_DEVICE_MANUFACTURER: String.raw`Firmware "Audit" \ Co`,
        CONFIG_ZMK_BATTERY_REPORT_INTERVAL: 120,
        ...(topology === 'split'
          ? {
              CONFIG_ZMK_SPLIT_BLE_CENTRAL_BATTERY_LEVEL_FETCHING: true,
              CONFIG_ZMK_SPLIT_BLE_CENTRAL_BATTERY_LEVEL_PROXY: true,
              CONFIG_ZMK_USB_BOOT: true,
            }
          : {}),
      },
    };
    assert.deepEqual(validateFirmware(project, { options: FIRMWARE_OPTIONS, board }), []);
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
    for (const suffix of topology === 'split' ? ['_left', '_right'] : ['']) {
      const id = `firmware-${topology}${suffix}`;
      assert.equal(
        files.some((file) => file.path === 'config/unibody_six.conf'),
        topology === 'unibody',
      );
      const central = suffix !== '_right';
      const expectedConfig = {
        CONFIG_ZMK_SLEEP: 'y',
        CONFIG_ZMK_IDLE_SLEEP_TIMEOUT: '600000',
        CONFIG_ZMK_IDLE_TIMEOUT: '45000',
        CONFIG_ZMK_KSCAN_DEBOUNCE_PRESS_MS: '0',
        CONFIG_ZMK_HID_REPORT_TYPE_NKRO: 'y',
        CONFIG_ZMK_BATTERY_REPORT_INTERVAL: '120',
        CONFIG_USB_DEVICE_MANUFACTURER: central
          ? String.raw`"Firmware \"Audit\" \\ Co"`
          : '"ZMK Project"',
        ...(topology === 'split'
          ? {
              CONFIG_ZMK_SPLIT_BLE_CENTRAL_BATTERY_LEVEL_FETCHING: central ? 'y' : null,
              CONFIG_ZMK_SPLIT_BLE_CENTRAL_BATTERY_LEVEL_PROXY: central ? 'y' : null,
              CONFIG_ZMK_USB_BOOT: central ? 'y' : null,
            }
          : {}),
      };
      for (const file of files) {
        const destination = path.join(directory, id, file.path);
        await mkdir(path.dirname(destination), { recursive: true });
        await writeFile(destination, file.content);
      }
      targets.push({
        id,
        board: board.id,
        shield: `${project.shieldName}${suffix}`,
        expectedConfig,
      });
    }
  }
  assert.equal(targets.length, 22);
  const { addBehavior, createBehaviorBinding, replaceBehavior, validateBehaviors } =
    await server.ssrLoadModule('/src/domain/behaviors/index.ts');
  let custom = structuredClone(UNIBODY_PRESET);
  for (const kind of ['hold-tap', 'tap-dance', 'mod-morph', 'sticky-key', 'sticky-layer']) {
    custom = addBehavior(custom, { kind, name: `Build ${kind}` });
  }
  const held = custom.behaviors[0];
  custom = replaceBehavior(custom, {
    ...held,
    flavor: 'balanced',
    retroTap: true,
    holdWhileUndecided: true,
    holdWhileUndecidedLinger: true,
    triggerKeyIds: ['k1', 'k2'],
    holdTriggerOnRelease: true,
  });
  custom = {
    ...custom,
    layers: custom.layers.map((layer, layerIndex) =>
      layerIndex === 0
        ? {
            ...layer,
            bindings: {
              ...layer.bindings,
              ...Object.fromEntries(
                custom.behaviors.map((behavior, index) => [
                  `k${index}`,
                  createBehaviorBinding(custom, behavior.id),
                ]),
              ),
            },
          }
        : layer,
    ),
  };
  assert.deepEqual(validateBehaviors(custom, BINDINGS_CATALOG), []);
  const customTarget = { ...SHIELD_TARGET, ...board, boardId: board.id };
  const customMatrix = deriveShieldMatrix(custom, customTarget);
  assert.equal(customMatrix.ok, true);
  const customFiles = generateRepositoryFiles(custom, {
    matrix: customMatrix.value,
    target: customTarget,
    includeWorkflow: false,
  });
  for (const file of customFiles) {
    const destination = path.join(directory, 'custom-behaviors', file.path);
    await mkdir(path.dirname(destination), { recursive: true });
    await writeFile(destination, file.content);
  }
  targets.push({ id: 'custom-behaviors', board: board.id, shield: custom.shieldName });
  await mkdir(directory, { recursive: true });
  const {
    addMacro,
    replaceMacro,
    addCombo,
    replaceCombo,
    addConditionalLayer,
    replaceConditionalLayer,
    validateAdvancedKeymap,
  } = await server.ssrLoadModule('/src/domain/advanced-keymap/index.ts');
  let advanced = {
    ...structuredClone(UNIBODY_PRESET),
    layers: [
      ...UNIBODY_PRESET.layers,
      { id: 'l2', name: 'Lower', bindings: {} },
      { id: 'l3', name: 'Adjust', bindings: {} },
    ],
  };
  advanced = addMacro(advanced, { name: 'Build sequence' });
  advanced = replaceMacro(advanced, {
    ...advanced.macros[0],
    steps: [
      {
        id: 's1',
        kind: 'press',
        binding: { kind: 'kp', key: { keycode: 'LSHIFT', modifiers: [] } },
      },
      { id: 's2', kind: 'tap', binding: { kind: 'kp', key: { keycode: 'A', modifiers: [] } } },
      { id: 's3', kind: 'wait', durationMs: 120 },
      {
        id: 's4',
        kind: 'release',
        binding: { kind: 'kp', key: { keycode: 'LSHIFT', modifiers: [] } },
      },
    ],
  });
  advanced = addCombo(advanced, { name: 'Build combo', keyIds: ['k0', 'k1'] });
  advanced = replaceCombo(advanced, {
    ...advanced.combos[0],
    binding: { kind: 'macro', macroId: 'm1' },
    layerIds: ['l0', 'l1'],
  });
  advanced = addConditionalLayer(advanced);
  advanced = replaceConditionalLayer(advanced, {
    id: 'q1',
    ifLayerIds: ['l1', 'l2'],
    thenLayerId: 'l3',
  });
  advanced = {
    ...advanced,
    layers: advanced.layers.map((layer, index) =>
      index === 0
        ? { ...layer, bindings: { ...layer.bindings, k0: { kind: 'macro', macroId: 'm1' } } }
        : layer,
    ),
  };
  assert.deepEqual(validateAdvancedKeymap(advanced, BINDINGS_CATALOG), []);
  const advancedMatrix = deriveShieldMatrix(advanced, customTarget);
  assert.equal(advancedMatrix.ok, true);
  const advancedFiles = generateRepositoryFiles(advanced, {
    matrix: advancedMatrix.value,
    target: customTarget,
    includeWorkflow: false,
  });
  for (const file of advancedFiles) {
    const destination = path.join(directory, 'advanced-keymap', file.path);
    await mkdir(path.dirname(destination), { recursive: true });
    await writeFile(destination, file.content);
  }
  targets.push({ id: 'advanced-keymap', board: board.id, shield: advanced.shieldName });
  const { analyzeProject } = await server.ssrLoadModule('/src/domain/analysis/index.ts');
  for (const mode of ['unibody', 'split', 'split-right']) {
    const boards =
      mode === 'unibody'
        ? [board, CONTROLLER_BOARDS.find((entry) => entry.id === 'seeeduino_xiao_ble')]
        : [board];
    for (const encoderBoard of boards) {
      assert.ok(encoderBoard);
      const apply = (project, input) => {
        const result = editWiring(project, { ...input, board: encoderBoard });
        assert.equal(result.ok, true, result.error);
        return result.value;
      };
      let project = apply({ ...advanced, controllerId: encoderBoard.id }, { kind: 'initialize' });
      project = apply(project, {
        kind: 'topology',
        topology: mode === 'unibody' ? 'unibody' : 'split',
      });
      for (const half of ['left', 'right']) {
        const terminals = project.wiring.terminals.filter(
          (entry) => entry.half === half && entry.kind !== 'ground',
        );
        for (const [index, terminal] of terminals.entries()) {
          project = apply(project, {
            kind: 'pin',
            terminalId: terminal.id,
            boardPin: encoderBoard.gpioPins[index],
          });
        }
      }
      const halves = mode === 'unibody' ? ['left'] : ['left', 'right'];
      const sensorHalves = mode === 'split-right' ? ['right'] : halves;
      project = {
        ...project,
        encoders: sensorHalves.map((half, index) => ({
          id: `e${index + 1}`,
          xU: 6 + index * 2,
          yU: 0,
          half,
          aPin: encoderBoard.gpioPins.at(-1),
          bPin: encoderBoard.gpioPins.at(-2),
          steps: 80,
          triggersPerRotation: 20 - index * 10,
        })),
        layers: project.layers.map((layer, layerIndex) => ({
          ...layer,
          encoderBindings: Object.fromEntries(
            sensorHalves.map((_, index) => [
              `e${index + 1}`,
              {
                clockwise:
                  layerIndex === 0
                    ? { kind: 'macro', macroId: 'm1' }
                    : { kind: 'kp', key: { keycode: 'C_VOL_UP', modifiers: [] } },
                counterclockwise: { kind: 'kp', key: { keycode: 'C_VOL_DN', modifiers: [] } },
              },
            ]),
          ),
        })),
      };
      const target = { ...SHIELD_TARGET, ...encoderBoard, boardId: encoderBoard.id };
      const analysis = analyzeProject(project, {
        board: encoderBoard,
        target,
        bindingsCatalog: BINDINGS_CATALOG,
        firmwareOptions: FIRMWARE_OPTIONS,
      });
      assert.deepEqual(analysis.issues, []);
      assert.equal(analysis.matrix.ok, true);
      const files = generateRepositoryFiles(project, {
        matrix: analysis.matrix.value,
        target,
        includeWorkflow: false,
      });
      for (const half of halves) {
        const id = `encoders-${mode}-${encoderBoard.id}-${half}`;
        for (const file of files) {
          const destination = path.join(directory, id, file.path);
          await mkdir(path.dirname(destination), { recursive: true });
          await writeFile(destination, file.content);
        }
        const local = sensorHalves.includes(half);
        targets.push({
          id,
          board: encoderBoard.id,
          shield: `${project.shieldName}${mode === 'unibody' ? '' : `_${half}`}`,
          expectedConfig: local ? { CONFIG_EC11: 'y', CONFIG_EC11_TRIGGER_GLOBAL_THREAD: 'y' } : {},
          expectedAbsentConfig: local ? [] : ['CONFIG_EC11', 'CONFIG_EC11_TRIGGER_GLOBAL_THREAD'],
        });
      }
    }
  }
  const applyStress = (project, input) => {
    const result = editWiring(project, { ...input, board });
    assert.equal(result.ok, true, result.error);
    return result.value;
  };
  let stress = applyStress(advanced, { kind: 'initialize' });
  stress = applyStress(stress, { kind: 'topology', topology: 'split' });
  for (const half of ['left', 'right']) {
    const terminals = stress.wiring.terminals.filter(
      (entry) => entry.half === half && entry.kind !== 'ground',
    );
    for (const [index, terminal] of terminals.entries()) {
      stress = applyStress(stress, {
        kind: 'pin',
        terminalId: terminal.id,
        boardPin: board.gpioPins[index],
      });
    }
  }
  const stressEncoders = ['left', 'right'].flatMap((half, halfIndex) => {
    const used = new Set(
      stress.wiring.terminals.filter((entry) => entry.half === half).map((entry) => entry.boardPin),
    );
    const free = board.gpioPins.filter((pin) => !used.has(pin));
    assert.ok(free.length >= 12);
    return Array.from({ length: 6 }, (_, index) => ({
      id: `e${halfIndex * 6 + index + 1}`,
      xU: 6 + index * 2,
      yU: halfIndex * 2,
      half,
      aPin: free[index * 2],
      bPin: free[index * 2 + 1],
      steps: 80,
      triggersPerRotation: 20,
    }));
  });
  stress = {
    ...stress,
    encoders: stressEncoders,
    layers: Array.from({ length: 32 }, (_, index) => ({
      id: `l${index}`,
      name: `Layer ${index}`,
      bindings: {},
    })),
  };
  const stressAnalysis = analyzeProject(stress, {
    board,
    target: customTarget,
    bindingsCatalog: BINDINGS_CATALOG,
    firmwareOptions: FIRMWARE_OPTIONS,
  });
  assert.deepEqual(stressAnalysis.issues, []);
  assert.equal(stressAnalysis.matrix.ok, true);
  const stressFiles = generateRepositoryFiles(stress, {
    matrix: stressAnalysis.matrix.value,
    target: customTarget,
    includeWorkflow: false,
  });
  for (const half of ['left', 'right']) {
    const id = `encoders-memory-${half}`;
    for (const file of stressFiles) {
      const destination = path.join(directory, id, file.path);
      await mkdir(path.dirname(destination), { recursive: true });
      await writeFile(destination, file.content);
    }
    targets.push({
      id,
      board: board.id,
      shield: `${stress.shieldName}_${half}`,
      expectedConfig: { CONFIG_EC11: 'y', CONFIG_EC11_TRIGGER_GLOBAL_THREAD: 'y' },
    });
  }
  await writeFile(path.join(directory, 'targets.json'), `${JSON.stringify(targets, null, 2)}\n`);
  process.stdout.write(`Generated ${targets.length} deterministic actual-export build targets\n`);
} finally {
  await server.close();
}
