export function focusKeyLater(keyId: string) {
  requestAnimationFrame(() => {
    document.querySelector<SVGGElement>(`[data-key-focus-id="${keyId}"]`)?.focus();
  });
}

// With no keys left, focus returns to the canvas itself (accessibility.md "Focus is never lost").
export function focusCanvasLater() {
  requestAnimationFrame(() => {
    document
      .querySelector<SVGElement | HTMLElement>('[data-canvas-workspace="schematic"]')
      ?.focus();
  });
}
