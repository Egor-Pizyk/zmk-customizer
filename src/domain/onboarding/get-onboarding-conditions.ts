import type { Project } from '@domain';
import type { OnboardingFacts } from './onboarding-types';

function hasLayout(project: Project): boolean {
  if (project.keys.length !== 9) {
    return false;
  }
  const keys = project.keys.toSorted((left, right) => left.yU - right.yU || left.xU - right.xU);
  const first = keys[0];
  if (first === undefined) {
    return false;
  }
  return keys.every(
    (key, index) =>
      Math.abs(key.xU - first.xU - (index % 3)) < 0.0001 &&
      Math.abs(key.yU - first.yU - Math.floor(index / 3)) < 0.0001 &&
      (key.widthU ?? 1) === 1 &&
      (key.heightU ?? 1) === 1 &&
      (key.rotationDeg ?? 0) === 0,
  );
}

function hasBindings(project: Project, digitKeycodes: OnboardingFacts['digitKeycodes']): boolean {
  if (!hasLayout(project)) {
    return false;
  }
  const keys = project.keys.toSorted((left, right) => left.yU - right.yU || left.xU - right.xU);
  return keys.every((key, index) => {
    const binding = project.layers[0]?.bindings[key.id];
    return (
      binding?.kind === 'kp' &&
      digitKeycodes[index]?.includes(binding.key.keycode) === true &&
      binding.key.modifiers.length === 0
    );
  });
}

export function getOnboardingConditions(project: Project, facts: OnboardingFacts) {
  const firstDiode = project.keys[0]?.diode;
  return {
    name: facts.hasValidName && project.name.trim() !== '' && project.name !== 'My keyboard',
    layout: hasLayout(project),
    controller: facts.isBoardSupported,
    diodes:
      project.keys.length === 9 &&
      firstDiode !== undefined &&
      project.keys.every(
        (key) => key.diode?.pin === firstDiode.pin && key.diode.cathode === firstDiode.cathode,
      ),
    wiring: facts.hasMatrix,
    pins: facts.hasPins,
    bindings: hasBindings(project, facts.digitKeycodes),
    problems: !facts.hasIssues,
  };
}
