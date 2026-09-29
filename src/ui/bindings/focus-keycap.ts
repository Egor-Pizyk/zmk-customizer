export function focusKeycap(keyId: string) {
  document.querySelector<SVGGElement>(`[data-keycap-id="${keyId}"]`)?.focus();
}
