import type { Binding } from './types';

export type Combo = {
  readonly id: string;
  readonly name: string;
  readonly keyIds: readonly string[];
  readonly binding: Binding;
  readonly timeoutMs: number;
  readonly layerIds: readonly string[];
};
export type MacroStep = { readonly id: string } & (
  | { readonly kind: 'tap' | 'press' | 'release'; readonly binding: Binding }
  | { readonly kind: 'wait'; readonly durationMs: number }
);
export type Macro = {
  readonly id: string;
  readonly name: string;
  readonly waitMs: number;
  readonly tapMs: number;
  readonly steps: readonly MacroStep[];
};
export type ConditionalLayer = {
  readonly id: string;
  readonly ifLayerIds: readonly string[];
  readonly thenLayerId: string;
};
export type AdvancedKeymapLimits = {
  readonly comboKeys: number;
  readonly macroBindings: number;
  readonly macroQueue: number;
};
