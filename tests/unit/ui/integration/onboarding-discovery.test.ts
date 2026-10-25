import { expect, it } from 'vitest';
import { ONBOARDING_STEPS } from '@domain/onboarding';
import { getOnboardingContent } from '@ui/onboarding/logic';

it('gives every step a current workspace, target and concrete explanation', () => {
  for (const step of ONBOARDING_STEPS) {
    const content = getOnboardingContent(step);
    expect(content.title.length).toBeGreaterThan(5);
    expect(content.why.length).toBeGreaterThan(20);
    expect(content.action.length).toBeGreaterThan(20);
    expect(content.target).not.toBe('');
  }
  const discovery = ['discovery-project', 'discovery-bindings', 'discovery-hardware'] as const;
  const text = discovery
    .map((step) => {
      const entry = getOnboardingContent(step);
      return `${entry.why} ${entry.action}`;
    })
    .join(' ');
  for (const topic of [
    'presets',
    'Open',
    'Save',
    'KLE',
    'agent',
    'Layers',
    'behaviors',
    'Combos',
    'macros',
    'conditional',
    'encoders',
    'split',
    'scan',
    'Settings',
    'Firmware',
  ]) {
    expect(text).toContain(topic);
  }
  expect(ONBOARDING_STEPS.indexOf('discovery-hardware')).toBeLessThan(
    ONBOARDING_STEPS.indexOf('download'),
  );
});
