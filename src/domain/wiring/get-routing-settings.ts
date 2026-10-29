import type { Project, RoutingSettings } from '@domain';

export function getRoutingSettings(project: Project): RoutingSettings {
  return (
    project.routing ?? {
      matrixStyle: project.wires.length === 0 ? 'symmetric-bus' : 'existing',
      offsetU: 0.15,
      clearanceU: 0.1,
      fallbackRowIntervalU: 1,
      preferredScope: 'all',
    }
  );
}
