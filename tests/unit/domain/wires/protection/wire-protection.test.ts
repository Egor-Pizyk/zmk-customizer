import { describe, expect, it } from 'vitest';
import { validateWireProtection, getWireProtection } from '@domain/wires/protection';
import type { Project } from '@domain';
import { buildLockedWiringProject } from '../../../../helpers/symmetric-wiring-fixtures';

describe('wire protection policy', () => {
  it('protects bends, ends, identity, anchors and pooled contacts without mutating input', () => {
    const base = buildLockedWiringProject();
    const snapshot = structuredClone(base);
    const candidates = protectedCandidates(base);
    for (const candidate of candidates) {
      expect(validateWireProtection(base, candidate)).toContainEqual(
        expect.objectContaining({ code: 'wire-locked', path: ['wires', 0] }),
      );
    }
    expect(base).toEqual(snapshot);
  });

  it('protects terminal meaning even when no wire fields changed', () => {
    const base = buildLockedWiringProject();
    const wiring = requireWiring(base);
    const candidate = {
      ...base,
      wiring: {
        ...wiring,
        terminals: wiring.terminals.map((terminal) => ({
          id: terminal.id,
          half: terminal.half,
          kind: terminal.kind,
          boardPin: 7,
        })),
      },
    };
    expect(validateWireProtection(base, candidate)).toHaveLength(1);
    expect(validateWireProtection(base, { ...base, controllerId: 'kb2040' })).toHaveLength(1);
  });

  it('rejects removal of a junction and new electrical contact, but permits removal of an insulated crossing', () => {
    const base = buildLockedWiringProject();
    expect(
      validateWireProtection(base, {
        ...base,
        wires: base.wires.filter((wire) => wire.id !== 'w1'),
      }),
    ).toHaveLength(1);
    expect(validateWireProtection(base, { ...base, insulatedCrossings: [] })).toHaveLength(1);
    expect(
      validateWireProtection(base, {
        ...base,
        wires: base.wires.filter((wire) => wire.id !== 'w2'),
        insulatedCrossings: [],
      }),
    ).toEqual([]);
  });

  it('allows an unrelated project edit and does not propagate a lock through the net', () => {
    const base = buildLockedWiringProject();
    expect(validateWireProtection(base, { ...base, name: 'Changed' })).toEqual([]);
    expect(getWireProtection(base, { keyIds: ['k0', 'k1'] }).map((entry) => entry.wireId)).toEqual([
      'w0',
    ]);
    expect(getWireProtection(base, { keyIds: ['k2', 'k3'] })).toEqual([]);
  });

  it('allows a separate unlock-only edit but rejects unlock plus mutation', () => {
    const base = buildLockedWiringProject();
    const unlocked = {
      ...base,
      wires: base.wires.map((wire) => {
        const { locked: _removed, ...rest } = wire;
        return rest;
      }),
    };
    expect(validateWireProtection(base, unlocked)).toEqual([]);
    expect(validateWireProtection(base, { ...unlocked, wires: [] })).toHaveLength(1);
    expect(validateWireProtection(base, { ...unlocked, name: 'Combined edit' })).toHaveLength(1);
  });
});

function protectedCandidates(base: Project): Project[] {
  return [
    { ...base, wires: base.wires.filter((wire) => wire.id !== 'w0') },
    {
      ...base,
      wires: base.wires.map((wire) =>
        wire.id === 'w0' ? { ...wire, bends: [{ xU: 1, yU: 1 }] } : wire,
      ),
    },
    { ...base, wireContacts: [{ keyId: 'k3', pin: 1, at: { xU: 2.3, yU: 0.3667 } }] },
    { ...base, keys: base.keys.map((key) => (key.id === 'k1' ? { ...key, yU: 1 } : key)) },
    {
      ...base,
      keys: base.keys.map((key) =>
        key.id === 'k0' ? { ...key, diode: { pin: 1, cathode: 'toward-switch' } } : key,
      ),
    },
  ];
}

function requireWiring(project: Project) {
  if (project.wiring === undefined) {
    throw new Error('Missing fixture wiring');
  }
  return project.wiring;
}
