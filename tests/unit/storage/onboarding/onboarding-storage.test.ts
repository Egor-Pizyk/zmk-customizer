// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  loadOnboarding,
  markOnboardingShown,
  saveOnboarding,
  readOnboardingShown,
  discardOnboarding,
  ONBOARDING_SESSION_KEY,
  readOnboardingBackup,
} from '@storage/onboarding';
import { createProject } from '@domain/project';

beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});
const record = {
  version: 1,
  tutorialRevision: 1,
  project: createProject({ controllerId: 'nice_nano_v2' }),
  stepId: 'name',
  acknowledgedStepIds: [],
  outcome: 'in-progress',
} as const;
describe('onboarding storage boundary', () => {
  it('stores shown separately from a validated tutorial and the ordinary project', () => {
    localStorage.setItem('zmk-customizer:project', 'original');
    expect(readOnboardingShown()).toEqual({ ok: true, value: false });
    expect(markOnboardingShown().ok).toBe(true);
    expect(saveOnboarding(record).ok).toBe(true);
    expect(loadOnboarding()).toEqual({ ok: true, value: record });
    expect(readOnboardingShown()).toEqual({ ok: true, value: true });
    expect(discardOnboarding().ok).toBe(true);
    expect(readOnboardingShown()).toEqual({ ok: true, value: true });
    expect(localStorage.getItem('zmk-customizer:project')).toBe('original');
  });
  it.each(['{', '{"version":99}', '{"version":1,"tutorialRevision":1,"project":{}}'])(
    'preserves invalid or newer raw data: %s',
    (raw) => {
      localStorage.setItem(ONBOARDING_SESSION_KEY, raw);
      expect(loadOnboarding().ok).toBe(false);
      expect(localStorage.getItem(ONBOARDING_SESSION_KEY)).toBe(raw);
      expect(readOnboardingBackup()).toEqual({ ok: true, value: raw });
    },
  );
  it('reports quota failures without pretending a candidate was saved', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('full', 'QuotaExceededError');
    });
    expect(saveOnboarding(record).ok).toBe(false);
    expect(markOnboardingShown().ok).toBe(false);
  });
});

it('migrates a historical nested project without adding tour state to Project', () => {
  localStorage.setItem(
    ONBOARDING_SESSION_KEY,
    JSON.stringify({ ...record, project: { ...record.project, schemaVersion: 12 } }),
  );
  const loaded = loadOnboarding();
  expect(loaded).toMatchObject({
    ok: true,
    value: { project: { schemaVersion: 13 }, stepId: 'name' },
  });
  expect(localStorage.getItem('zmk-customizer:project')).toBeNull();
});
