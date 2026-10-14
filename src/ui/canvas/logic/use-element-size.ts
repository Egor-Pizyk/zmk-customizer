import { useEffect, useState } from 'react';
import type { RefObject } from 'react';

export type ElementSize = {
  readonly widthPx: number;
  readonly heightPx: number;
};

// Size is set from the observer callback, not the effect body (React Compiler rules).
export function useElementSize(elementRef: RefObject<Element | null>): ElementSize {
  const [size, setSize] = useState<ElementSize>({ widthPx: 0, heightPx: 0 });
  useEffect(() => {
    const element = elementRef.current;
    const observer = new ResizeObserver(([entry]) => {
      if (entry !== undefined) {
        setSize({ widthPx: entry.contentRect.width, heightPx: entry.contentRect.height });
      }
    });
    if (element !== null) {
      observer.observe(element);
    }
    return () => {
      observer.disconnect();
    };
  }, [elementRef]);
  return size;
}
