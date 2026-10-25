import { useEffect, useEffectEvent, useRef, useState } from 'react';
import { ONBOARDING_STEPS } from '@domain/onboarding';
import { useProject } from '@ui/project/logic';
import { usePreferences } from '@ui/preferences';
import { getOnboardingContent } from './onboarding-steps';
import { useOnboardingTarget } from './use-onboarding-target';
import { useOnboardingFocus } from './use-onboarding-focus';

function useTourNavigation(stepId: Parameters<typeof getOnboardingContent>[0]) {
  const { preferences, changePreferences } = usePreferences();
  const original = useRef(preferences);
  const navigate = useEffectEvent((step: typeof stepId) => {
    changePreferences({
      activeWorkspaceId: getOnboardingContent(step).workspace,
      isPartsListOpen: ['layout', 'diodes'].includes(step),
      isIssuesPanelOpen: step === 'problems',
      isBindingsTableOpen: true,
    });
  });
  const restore = useEffectEvent(() => {
    changePreferences(original.current);
    queueMicrotask(() => {
      document.querySelector<HTMLButtonElement>('[aria-label="Take the tour again"]')?.focus();
    });
  });
  useEffect(() => {
    navigate(stepId);
  }, [stepId]);
  useEffect(
    () => () => {
      restore();
    },
    [],
  );
  return preferences.activeWorkspaceId;
}
export function useOnboardingController() {
  const context = useProject();
  const stepId = context.tutorial?.record.stepId ?? 'name';
  const content = getOnboardingContent(stepId);
  const workspace = useTourNavigation(stepId);
  const [dialog, setDialog] = useState<'exit' | 'adopt' | undefined>();
  const [retry, setRetry] = useState(0);
  const bounds = useOnboardingTarget({
    targetId: content.target,
    revision: `${stepId}:${workspace}:${retry}`,
  });
  useOnboardingFocus(content.target, `${stepId}:${workspace}`, () => {
    setDialog('exit');
  });
  const conditions = context.tutorialConditions;
  const condition =
    conditions !== undefined &&
    (!(stepId in conditions) ||
      Object.entries(conditions).some(([id, value]) => id === stepId && value));
  const filesReady = stepId !== 'files' || context.tutorial?.viewedFiles?.length === 3;
  const requiresValid = ['problems', 'firmware', 'files'].includes(stepId);
  const canContinue = condition && filesReady && (!requiresValid || context.issues.length === 0);
  return {
    context,
    content,
    stepId,
    index: ONBOARDING_STEPS.indexOf(stepId),
    total: ONBOARDING_STEPS.length,
    bounds,
    dialog,
    setDialog,
    canContinue,
    condition,
    retryTarget: () => {
      setRetry(retry + 1);
    },
  };
}
