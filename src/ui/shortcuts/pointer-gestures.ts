// Listed in the help dialog next to SHORTCUTS; `{primary}` becomes Cmd or Ctrl.
export const POINTER_GESTURES = [
  { gesture: '{primary} + wheel', action: 'Zoom around the pointer' },
  { gesture: 'Wheel or trackpad scroll', action: 'Pan' },
  { gesture: 'Middle-button drag', action: 'Pan' },
  { gesture: 'Drag the tools window title', action: 'Move the tools window' },
  { gesture: 'Arrow keys on the tools window title', action: 'Move it 16 px (Shift: 64 px)' },
  { gesture: 'Schematic, Key tool: click', action: 'Place a key' },
  { gesture: '{primary} + Space on a Schematic key', action: 'Toggle key selection' },
  {
    gesture: 'Schematic, Select tool: Shift or {primary} + click a key',
    action: 'Toggle key selection',
  },
  {
    gesture: 'Schematic: selected-layout number fields and Preview / Apply',
    action: 'Resize, rotate or move selected keys in one undo step',
  },
  { gesture: 'Schematic, Select tool: drag a key', action: 'Move the key' },
  {
    gesture: 'Schematic: drag outside a selected key or encoder corner',
    action:
      'Rotate around its center. Snap on: slow rotation catches 0°, 90°, 120° and 180°. Shift: 15° steps.',
  },
  { gesture: 'Schematic, Wire tool: click, click…, click a pin or wire', action: 'Draw a wire' },
  { gesture: 'Schematic, Wire tool: double-click', action: 'End the wire with a free end' },
  { gesture: 'Schematic, Select tool: drag a bend handle', action: 'Move a wire bend' },
  { gesture: 'Schematic: click a crossing button', action: 'Insulate or connect the crossing' },
] as const;
