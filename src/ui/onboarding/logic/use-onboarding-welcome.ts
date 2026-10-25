import { useEffect, useEffectEvent, useState } from 'react';
import { useProject } from '@ui/project/logic';
import {
  readOnboardingShown,
  markOnboardingShown,
  loadOnboarding,
  discardOnboarding,
  readOnboardingBackup,
} from '@storage/onboarding';
import { downloadTextFile } from '@ui/downloads';

function initialWelcome(isReplay: boolean) {
  const shown = readOnboardingShown();
  return {
    isOpen: isReplay || (shown.ok && !shown.value),
    retained: loadOnboarding(),
    confirmNew: false,
    error: shown.ok ? '' : shown.error,
  };
}
export function useOnboardingWelcome(isReplay: boolean) {
  const context = useProject();
  const [welcome, setWelcome] = useState(() => initialWelcome(isReplay));
  useShownMarker(welcome.isOpen, (error) => {
    setWelcome((value) => ({ ...value, error }));
  });
  function handleClose() {
    setWelcome((value) => ({ ...value, isOpen: false }));
  }
  function handleStart(resume: boolean) {
    if (
      !resume &&
      welcome.retained.ok &&
      welcome.retained.value !== undefined &&
      !welcome.confirmNew
    ) {
      setWelcome({ ...welcome, confirmNew: true });
      return;
    }
    context.startTutorial(resume);
    handleClose();
  }
  function handleDiscard() {
    setWelcome(discardWelcome(welcome));
  }
  function handleRecover() {
    recoverWelcome((error) => {
      setWelcome({ ...welcome, error });
    });
  }
  return {
    ...welcome,
    isOpen: welcome.isOpen && context.tutorial === undefined,
    handleClose,
    handleStart,
    handleDiscard,
    handleRecover,
  };
}

function useShownMarker(isOpen: boolean, onError: (error: string) => void) {
  const reportError = useEffectEvent(onError);
  useEffect(() => {
    const saved = isOpen ? markOnboardingShown() : undefined;
    const frame = requestAnimationFrame(() => {
      if (saved !== undefined && !saved.ok) {
        reportError(`${saved.error} The automatic tour may appear again on a later visit.`);
      }
    });
    return () => {
      cancelAnimationFrame(frame);
    };
  }, [isOpen]);
}

function recoverWelcome(report: (error: string) => void) {
  const read = readOnboardingBackup();
  if (!read.ok) {
    report(read.error);
    return;
  }
  if (!downloadTextFile({ fileName: 'learning-session-backup.json', text: read.value }).ok) {
    report('Could not download the learning backup.');
  }
}

function discardWelcome(
  welcome: ReturnType<typeof initialWelcome>,
): ReturnType<typeof initialWelcome> {
  const result = discardOnboarding();
  return result.ok
    ? { ...welcome, retained: { ok: true, value: undefined }, confirmNew: false }
    : { ...welcome, error: result.error };
}
