import type { ControllerBoard, Project, ValidationIssue } from '@domain';
import { getProjectBindingEntries } from '@domain/bindings';

export function validateControllerBindings(
  project: Project,
  board: ControllerBoard,
): readonly ValidationIssue[] {
  if (board.ble) {
    return [];
  }
  return getProjectBindingEntries(project).flatMap(({ binding, path, label }) => {
    if (binding.kind !== 'bt' && !(binding.kind === 'out' && binding.command === 'OUT_BLE')) {
      return [];
    }
    return [
      {
        code: 'binding-controller-unsupported',
        path,
        message: `${label} uses Bluetooth, unavailable on ${board.name}. Choose a USB-compatible action in Bindings or a Bluetooth controller in Schematic.`,
      },
    ];
  });
}
