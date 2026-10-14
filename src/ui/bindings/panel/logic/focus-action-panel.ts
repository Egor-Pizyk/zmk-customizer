// After a selection change the panel renders on the next frame; focus the open slot's search
// field then (spec 006 FR-012).
export function focusActionPanel() {
  requestAnimationFrame(() => {
    document.querySelector<HTMLElement>('[data-action-panel] [data-panel-focus]')?.focus();
  });
}
