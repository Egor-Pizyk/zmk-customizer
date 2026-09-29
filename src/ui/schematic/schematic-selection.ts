import type { WireEndSide } from '../../domain/types';

// UI state, not project data: never saved or undone (react.md "Project state").
export type SchematicSelection =
  | { readonly kind: 'key'; readonly keyId: string }
  | { readonly kind: 'wire'; readonly wireId: string }
  | { readonly kind: 'wire-end'; readonly wireId: string; readonly side: WireEndSide }
  | {
      readonly kind: 'multi';
      readonly keyIds: readonly string[];
      readonly wireIds: readonly string[];
    }
  | undefined;

/** Omit the argument to clear the selection. */
export type SelectionChange = (selection?: SchematicSelection) => void;
