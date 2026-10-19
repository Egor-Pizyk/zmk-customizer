import type { Binding, KeyStroke, Modifier } from './types';

export type BehaviorParameter =
  | { readonly kind: 'key'; readonly key: KeyStroke }
  | { readonly kind: 'layer'; readonly layerId: string }
  | { readonly kind: 'dummy' };

export type HoldTapTarget =
  | 'kp'
  | 'sk'
  | 'kt'
  | 'mo'
  | 'tog'
  | 'to'
  | 'sl'
  | 'none'
  | 'trans'
  | 'caps_word'
  | 'key_repeat'
  | 'gresc'
  | 'sys_reset'
  | 'bootloader';
export type HoldTapFlavor =
  | 'hold-preferred'
  | 'balanced'
  | 'tap-preferred'
  | 'tap-unless-interrupted';
type BehaviorIdentity = { readonly id: string; readonly name: string };
export type CustomBehavior = BehaviorIdentity &
  (
    | {
        readonly kind: 'hold-tap';
        readonly holdBehavior: HoldTapTarget;
        readonly tapBehavior: HoldTapTarget;
        readonly flavor: HoldTapFlavor;
        readonly tappingTermMs: number;
        readonly quickTapMs: number;
        readonly requirePriorIdleMs: number;
        readonly retroTap: boolean;
        readonly holdWhileUndecided: boolean;
        readonly holdWhileUndecidedLinger: boolean;
        readonly triggerKeyIds: readonly string[];
        readonly holdTriggerOnRelease: boolean;
      }
    | {
        readonly kind: 'tap-dance';
        readonly bindings: readonly { readonly id: string; readonly binding: Binding }[];
        readonly tappingTermMs: number;
      }
    | {
        readonly kind: 'mod-morph';
        readonly normal: Binding;
        readonly morphed: Binding;
        readonly mods: readonly Modifier[];
        readonly keepMods: readonly Modifier[];
      }
    | {
        readonly kind: 'sticky-key' | 'sticky-layer';
        readonly releaseAfterMs: number;
        readonly quickRelease: boolean;
        readonly lazy: boolean;
        readonly ignoreModifiers: boolean;
      }
  );
