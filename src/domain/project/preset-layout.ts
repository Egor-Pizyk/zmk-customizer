import type { Key } from '@domain';

export type PresetLayoutKey = Omit<Key, 'id' | 'diode'> & { readonly keycode: string };

export type PresetLayout = {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly limitations: string;
  readonly topology: 'unibody' | 'split';
  readonly keys: readonly PresetLayoutKey[];
};

export type PresetBindingMode = 'qwerty' | 'empty';
