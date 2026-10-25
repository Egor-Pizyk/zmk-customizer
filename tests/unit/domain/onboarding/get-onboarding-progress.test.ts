import { describe, expect, it } from 'vitest';
import { getOnboardingConditions } from '@domain/onboarding';
import { createProject } from '@domain/project';

const empty = createProject({ controllerId: 'nice_nano_v2' });
const keys = Array.from({ length: 9 }, (_, index) => ({
  id: `k${index}`,
  xU: (index % 3) + 7,
  yU: Math.floor(index / 3) - 4,
}));
const facts = {
  hasValidName: true,
  digitKeycodes: Array.from({ length: 9 }, (_, index) => [`N${index + 1}`, `NUMBER_${index + 1}`]),
  hasMatrix: false,
  hasPins: false,
  hasIssues: true,
  isBoardSupported: true,
};

describe('tutorial completion conditions', () => {
  it('requires nine unit-pitch unrotated keys while allowing translation', () => {
    expect(getOnboardingConditions(empty, facts).layout).toBe(false);
    const project = Object.freeze({ ...empty, keys });
    expect(getOnboardingConditions(project, facts).layout).toBe(true);
    expect(getOnboardingConditions({ ...project, keys: keys.slice(1) }, facts).layout).toBe(false);
    expect(
      getOnboardingConditions(
        {
          ...project,
          keys: [{ id: 'k0', xU: 7, yU: -4, rotationDeg: 15 }, ...keys.slice(1)],
        },
        facts,
      ).layout,
    ).toBe(false);
    expect(
      getOnboardingConditions(
        { ...project, keys: keys.map((key) => ({ ...key, xU: key.xU * 2 })) },
        facts,
      ).layout,
    ).toBe(false);
  });
  it('uses geometric row-major IDs, not key array order, for digit bindings', () => {
    const bindings = Object.fromEntries(
      keys.map((key, index) => [
        key.id,
        { kind: 'kp', key: { keycode: `N${index + 1}`, modifiers: [] } } as const,
      ]),
    );
    const project = {
      ...empty,
      keys: keys.toReversed(),
      layers: [{ id: 'l0', name: 'Base', bindings }],
    };
    expect(getOnboardingConditions(project, facts).bindings).toBe(true);
    expect(getOnboardingConditions({ ...project, layers: empty.layers }, facts).bindings).toBe(
      false,
    );
  });
  it('does not accept an empty diode set or failed analysis as wiring', () => {
    expect(getOnboardingConditions(empty, facts).diodes).toBe(false);
    expect(getOnboardingConditions({ ...empty, keys }, facts).wiring).toBe(false);
    expect(
      getOnboardingConditions(
        {
          ...empty,
          keys: keys.map((key) => ({
            id: key.id,
            xU: key.xU,
            yU: key.yU,
            diode: { pin: 1, cathode: 'away-switch' },
          })),
        },
        facts,
      ).diodes,
    ).toBe(true);
  });
});

it('keeps invalid project and shield names on the name step', () => {
  expect(
    getOnboardingConditions({ ...empty, name: 'Not valid' }, { ...facts, hasValidName: false })
      .name,
  ).toBe(false);
});
