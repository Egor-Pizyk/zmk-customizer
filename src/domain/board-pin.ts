// Generic placeholder board until controller boards (roadmap 006) map it to real pins; no GND or
// power pins (003 clarification). Not ZMK data, so it lives outside catalog/.
export const BOARD_PIN_COUNT = 32;

export function formatBoardPin(boardPin: number): string {
  return `P${boardPin}`;
}
