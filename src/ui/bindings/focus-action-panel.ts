// After a step change the next list renders on the next frame; focus its first control then.
export function focusActionPanel() {
  requestAnimationFrame(() => {
    document.querySelector<HTMLElement>('[data-action-panel] [data-panel-focus]')?.focus();
  });
}
