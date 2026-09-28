// After a row deletes itself, focus goes to the row that took its place (same index), else to
// the table's Add button, never to <body> (accessibility.md "Focus is never lost").
export function focusAfterDelete(input: {
  readonly table: 'key' | 'wire';
  readonly index: number;
}) {
  requestAnimationFrame(() => {
    const next = document.querySelector<HTMLElement>(
      `[data-parts-delete="${input.table}:${input.index}"]`,
    );
    const fallback = document.querySelector<HTMLElement>(`[data-parts-add="${input.table}"]`);
    (next ?? fallback)?.focus();
  });
}
