import { describe, expect, it } from 'vitest';
import { buildProject, freeEnd, keyPin } from '../../../tests/helpers/build-project';
import { formatCrossingLabel, formatKeyLabel, formatWireLabel } from './format-schematic-labels';

const PROJECT = buildProject({
  keys: [
    { id: 'k1', xU: 0, yU: 0 },
    { id: 'k2', xU: 2, yU: 1 },
  ],
  wires: [
    { id: 'w1', start: keyPin('k1', 1), end: keyPin('k2', 1), bends: [] },
    { id: 'w2', start: keyPin('k2', 2), end: freeEnd(3, 3, 3), bends: [] },
    {
      id: 'w3',
      start: keyPin('k1', 2),
      end: { kind: 'junction', wireId: 'w2', at: { xU: 3, yU: 2 } },
      bends: [],
    },
    { id: 'w4', start: keyPin('k1', 2), end: freeEnd(0, 3), bends: [] },
  ],
});

describe('formatKeyLabel', () => {
  it('names the key, its position and what each pin connects to', () => {
    expect(formatKeyLabel(PROJECT, { keyIndex: 1, isSelected: false, problems: [] })).toBe(
      'Key 1 at 2, 1. Pin 1: wire 0. Pin 2: wire 1',
    );
    expect(formatKeyLabel(PROJECT, { keyIndex: 0, isSelected: true, problems: ['Problem.'] })).toBe(
      'Key 0 at 0, 0. Pin 1: wire 0. Pin 2: wires 2, 3, selected. Problem.',
    );
  });

  it('says when a pin is not connected', () => {
    const project = buildProject({ keys: [{ id: 'k1', xU: 0, yU: 0 }] });
    expect(formatKeyLabel(project, { keyIndex: 0, isSelected: false, problems: [] })).toBe(
      'Key 0 at 0, 0. Pin 1: not connected. Pin 2: not connected',
    );
  });
});

describe('formatWireLabel', () => {
  it('names both ends', () => {
    expect(formatWireLabel(PROJECT, { wireIndex: 0 })).toBe(
      'Wire 0 from key 0 pin 1 to key 1 pin 1',
    );
    expect(formatWireLabel(PROJECT, { wireIndex: 1 })).toBe(
      'Wire 1 from key 1 pin 2 to board pin P3',
    );
    expect(formatWireLabel(PROJECT, { wireIndex: 2 })).toBe('Wire 2 from key 0 pin 2 to wire 1');
    expect(formatWireLabel(PROJECT, { wireIndex: 3 })).toBe(
      'Wire 3 from key 0 pin 2 to a free end',
    );
  });
});

describe('formatCrossingLabel', () => {
  it('names the wires and the state', () => {
    const crossing = {
      ref: { wireIds: ['w1', 'w4'] as const, ordinal: 0 },
      at: { xU: 0, yU: 0 },
      isInsulated: true,
    };
    expect(formatCrossingLabel(PROJECT, crossing)).toBe('Crossing of wire 0 and wire 3, insulated');
  });
});
