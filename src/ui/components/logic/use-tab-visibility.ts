import { useEffect, useRef } from 'react';

type TabVisibilityOptions = {
  readonly items: readonly { readonly id: string; readonly label: string }[];
  readonly selectedIndex: number;
};

// Scroll only the strip, preserving focus and the workspace's vertical position.
export function useTabVisibility({ items, selectedIndex }: TabVisibilityOptions) {
  const listRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const list = listRef.current;
    const selected =
      items[selectedIndex] === undefined ? undefined : list?.children.item(selectedIndex);
    if (list === null || selected === undefined || selected === null) {
      return;
    }
    const bounds = list.getBoundingClientRect();
    const tabBounds = selected.getBoundingClientRect();
    // Leave room for the focus outline and round outward for fractional CSS pixels.
    if (tabBounds.left < bounds.left + 4) {
      list.scrollLeft -= Math.ceil(bounds.left + 4 - tabBounds.left);
    } else if (tabBounds.right > bounds.right - 4) {
      list.scrollLeft += Math.ceil(tabBounds.right - bounds.right + 4);
    }
  }, [items, selectedIndex]);
  return listRef;
}
