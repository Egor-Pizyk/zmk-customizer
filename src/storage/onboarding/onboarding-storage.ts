import { z } from 'zod';
import type { Result } from '@domain';
import { ONBOARDING_STEPS } from '@domain/onboarding';
import type { OnboardingRecord } from '@domain/onboarding';
import { parseProjectFile, serializeProject } from '@storage/project';

export const ONBOARDING_SESSION_KEY = 'zmk-customizer:onboarding-session';
export const ONBOARDING_SHOWN_KEY = 'zmk-customizer:onboarding-shown';
const envelopeSchema = z.object({
  version: z.literal(1),
  tutorialRevision: z.literal(1),
  project: z.unknown(),
  stepId: z.enum(ONBOARDING_STEPS),
  acknowledgedStepIds: z.array(z.enum(ONBOARDING_STEPS)).max(ONBOARDING_STEPS.length),
  outcome: z.enum(['in-progress', 'closed', 'completed']),
});
const shownSchema = z.object({ version: z.literal(1), hasBeenShown: z.literal(true) });

function readRecord(key: string): Result<unknown, string> {
  try {
    const raw = localStorage.getItem(key);
    return { ok: true, value: raw === null ? undefined : JSON.parse(raw) };
  } catch {
    return {
      ok: false,
      error:
        'Could not read saved learning data. Your project is unchanged. Export your work or retry with browser storage available.',
    };
  }
}
function writeRecord(key: string, value: unknown): Result<void, string> {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return { ok: true, value: undefined };
  } catch {
    return {
      ok: false,
      error:
        'Could not save learning data. Free browser storage and retry. Your original project is unchanged.',
    };
  }
}
export function readOnboardingShown(): Result<boolean, string> {
  const read = readRecord(ONBOARDING_SHOWN_KEY);
  if (!read.ok) {
    return read;
  }
  if (read.value === undefined) {
    return { ok: true, value: false };
  }
  return shownSchema.safeParse(read.value).success
    ? { ok: true, value: true }
    : {
        ok: false,
        error:
          'The learning display record cannot be read. Start the tour manually; stored data has been preserved.',
      };
}
export function markOnboardingShown(): Result<void, string> {
  return writeRecord(ONBOARDING_SHOWN_KEY, { version: 1, hasBeenShown: true });
}
export function loadOnboarding(): Result<OnboardingRecord | undefined, string> {
  const read = readRecord(ONBOARDING_SESSION_KEY);
  if (!read.ok) {
    return read;
  }
  if (read.value === undefined) {
    return { ok: true, value: undefined };
  }
  const parsed = envelopeSchema.safeParse(read.value);
  if (!parsed.success) {
    return {
      ok: false,
      error:
        'This learning session is damaged or from a newer version. Download or explicitly discard the saved session before starting again.',
    };
  }
  const project = parseProjectFile(JSON.stringify(parsed.data.project));
  if (!project.ok) {
    return {
      ok: false,
      error:
        'The saved learning project cannot be loaded. Download or explicitly discard the saved session; your original project is unchanged.',
    };
  }
  return { ok: true, value: { ...parsed.data, project: project.value } };
}
export function saveOnboarding(record: OnboardingRecord): Result<void, string> {
  const serialized = serializeProject(record.project);
  if (!serialized.ok) {
    return {
      ok: false,
      error: 'The learning project cannot be saved. Undo the last change and retry.',
    };
  }
  return writeRecord(ONBOARDING_SESSION_KEY, record);
}
export function discardOnboarding(): Result<void, string> {
  try {
    localStorage.removeItem(ONBOARDING_SESSION_KEY);
    return { ok: true, value: undefined };
  } catch {
    return {
      ok: false,
      error: 'Could not discard the learning session. Retry with browser storage available.',
    };
  }
}
export function readOnboardingBackup(): Result<string, string> {
  try {
    return { ok: true, value: localStorage.getItem(ONBOARDING_SESSION_KEY) ?? '' };
  } catch {
    return { ok: false, error: 'Could not read the saved learning session.' };
  }
}
