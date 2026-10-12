/** Id of the tab showing `itemId`, for the tab panel's `aria-labelledby` (see `Tabs`). */
export function toTabId(idPrefix: string, itemId: string): string {
  return `${idPrefix}-tab-${itemId}`;
}
