/** Common native/React key primitives; no synthetic event is fabricated by the adapter. */
export type KeyInput = {
  readonly code: string;
  readonly key: string;
  readonly ctrlKey: boolean;
  readonly metaKey: boolean;
  readonly altKey: boolean;
  readonly shiftKey: boolean;
  readonly preventDefault: () => void;
  readonly stopPropagation: () => void;
};
