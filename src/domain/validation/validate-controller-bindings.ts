import type { ControllerBoard, Project, ValidationIssue } from '@domain';

export function validateControllerBindings(
  project: Project,
  board: ControllerBoard,
): readonly ValidationIssue[] {
  if (board.ble) {
    return [];
  }
  return project.layers.flatMap((layer, layerIndex) =>
    Object.entries(layer.bindings).flatMap(([keyId, binding]) => {
      if (binding.kind !== 'bt' && !(binding.kind === 'out' && binding.command === 'OUT_BLE')) {
        return [];
      }
      const keyIndex = project.keys.findIndex((key) => key.id === keyId);
      return [
        {
          code: 'binding-controller-unsupported' as const,
          path: ['layers', layerIndex, 'bindings', keyId],
          message: `Key ${keyIndex} on layer ${layer.name} uses Bluetooth, unavailable on ${board.name}. Choose a USB-compatible action in Bindings or a Bluetooth controller in Schematic.`,
        },
      ];
    }),
  );
}
