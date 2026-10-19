import { describe, expect, it } from 'vitest';
import { KEYBOARD_PRESETS } from '@catalog/presets';
import { validateProject } from '@domain/validation';
import { keycodeByName, BINDINGS_CATALOG } from '@catalog/bindings';
import { createLayoutPresetProject } from '@domain/project';
import type { Project } from '@domain';
import { parseProjectFile, serializeProject } from '@storage/project';

const expectedCounts = [104, 87, 84, 68, 61, 60, 48, 9, 42, 58, 58];

describe('layout preset creation (031)', () => {
  it('covers every explicitly named variant with stable unique identities', () => {
    expect(KEYBOARD_PRESETS.map((preset) => preset.keys.length)).toEqual(expectedCounts);
    expect(new Set(KEYBOARD_PRESETS.map((preset) => preset.id)).size).toBe(11);
  });

  for (const preset of KEYBOARD_PRESETS) {
    it(`creates independent ordinary projects for ${preset.id} without guessing wiring`, () => {
      const before = JSON.stringify(preset);
      const project = createLayoutPresetProject({
        preset,
        bindingMode: 'qwerty',
        controllerId: 'seeeduino_xiao_ble',
      });
      const empty = createLayoutPresetProject({
        preset,
        bindingMode: 'empty',
        controllerId: 'seeeduino_xiao_ble',
      });
      expect(
        validateProject(project, BINDINGS_CATALOG).filter(
          (issue) => issue.code !== 'key-pin-unconnected',
        ),
      ).toEqual([]);
      expect(project.name).toBe(preset.name);
      expect(project.controllerId).toBe('seeeduino_xiao_ble');
      expect(project.keys).toHaveLength(preset.keys.length);
      expect(project.keys[0]).not.toBe(preset.keys[0]);
      expect(project.wires).toEqual([]);
      expect(project.encoders).toEqual([]);
      expect(project.firmware).toEqual({});
      expect(project.behaviors).toEqual([]);
      expect(project.keys.every((key) => key.diode === undefined)).toBe(true);
      expect(project.layers).toHaveLength(1);
      const layer = project.layers.at(0);
      expect(layer?.name).toBe('Base');
      expect(Object.keys(getBindings(project))).toHaveLength(preset.keys.length);
      expect(getBindings(empty)).toEqual({});
      expect(empty.keys).toEqual(project.keys);
      for (const binding of Object.values(getBindings(project))) {
        expect(binding.kind).toBe('kp');
        expect(getKeycodeExists(binding)).toBe(true);
      }
      expect(parseProjectFile(serialize(project))).toEqual({ ok: true, value: project });
      expect(parseProjectFile(serialize(empty))).toEqual({ ok: true, value: empty });
      expect(JSON.stringify(preset)).toBe(before);
      expect(
        createLayoutPresetProject({
          preset,
          bindingMode: 'qwerty',
          controllerId: 'seeeduino_xiao_ble',
        }),
      ).toEqual(project);
    });
  }

  for (const preset of KEYBOARD_PRESETS.filter((entry) => entry.topology === 'split')) {
    it(`preserves explicit halves for ${preset.id} without inventing terminals`, () => {
      const project = createLayoutPresetProject({
        preset,
        bindingMode: 'empty',
        controllerId: 'nice_nano_v2',
      });
      expect(project.wiring).toEqual({
        kind: 'matrix',
        topology: 'split',
        diodeDirection: 'col2row',
        terminals: [],
      });
      expect(project.keys.filter((key) => key.half === 'left')).toHaveLength(
        preset.keys.length / 2,
      );
      expect(project.keys.filter((key) => key.half === 'right')).toHaveLength(
        preset.keys.length / 2,
      );
    });
  }
  it('does not add wiring metadata to unibody layouts', () => {
    for (const preset of KEYBOARD_PRESETS.filter((entry) => entry.topology === 'unibody')) {
      expect(
        createLayoutPresetProject({ preset, bindingMode: 'empty', controllerId: 'nice_nano_v2' })
          .wiring,
      ).toBeUndefined();
    }
  });

  it('uses independent ANSI and upstream Corne anchors including rotated thumbs', () => {
    const ansi = KEYBOARD_PRESETS.find((preset) => preset.id === 'ansi-60');
    expect(ansi?.keys[0]).toMatchObject({ xU: 0, yU: 0, keycode: 'GRAVE' });
    expect(ansi?.keys[13]).toMatchObject({ xU: 13, yU: 0, widthU: 2, keycode: 'BACKSPACE' });
    const corne = KEYBOARD_PRESETS.find((preset) => preset.id === 'corne-42');
    expect(corne?.keys[0]).toMatchObject({ xU: 0, yU: 0.37, half: 'left', keycode: 'TAB' });
    expect(corne?.keys[38]).toMatchObject({
      xU: 5.48,
      yU: 3.08,
      heightU: 1.5,
      rotationDeg: 24,
      rotationOriginXU: 5.48,
      rotationOriginYU: 4.58,
      half: 'left',
    });
    expect(corne?.keys[39]).toMatchObject({ rotationDeg: -24, half: 'right' });
  });
});

function serialize(project: Project): string {
  const result = serializeProject(project);
  if (!result.ok) {
    throw new Error(result.error);
  }
  return result.value;
}
function getBindings(project: Project) {
  const layer = project.layers[0];
  if (layer === undefined) {
    throw new Error('Missing Base layer');
  }
  return layer.bindings;
}
function getKeycodeExists(binding: Project['layers'][number]['bindings'][string]) {
  if (binding.kind !== 'kp') {
    throw new Error('Expected key press');
  }
  return keycodeByName.has(binding.key.keycode);
}
