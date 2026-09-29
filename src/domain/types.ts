export type Project = {
  readonly schemaVersion: 3;
  readonly name: string;
  /** User override of the technical name; absent = derived from `name` (spec 002 FR-012a). */
  readonly shieldName?: string;
  /** Array order is the key index (0..n-1) used by the keymap. */
  readonly keys: readonly Key[];
  readonly wires: readonly Wire[];
  /** Crossings are connected by default; only the insulated exceptions are stored (003 R6). */
  readonly insulatedCrossings: readonly CrossingRef[];
  /** Keymap layers in ZMK order; exactly one (Base) until spec 005 adds layer management. */
  readonly layers: readonly Layer[];
};

export type Layer = {
  readonly id: string;
  readonly name: string;
  /** Keyed by Key.id. Missing entry = unassigned = &none (spec 004 FR-021). */
  readonly bindings: Readonly<Record<string, Binding>>;
};

/** ZMK modifier functions (docs/zmk/keymap.md §4); stored unique, in this order. */
export const MODIFIERS = ['LC', 'LS', 'LA', 'LG', 'RC', 'RS', 'RA', 'RG'] as const;
export type Modifier = (typeof MODIFIERS)[number];

export type KeyStroke = {
  /** ZMK keycode name, canonical or alias, e.g. 'SPACE', 'N4', 'DOLLAR'. */
  readonly keycode: string;
  readonly modifiers: readonly Modifier[];
};

export type BluetoothCommand = 'BT_CLR' | 'BT_CLR_ALL' | 'BT_NXT' | 'BT_PRV';
export type BluetoothProfileCommand = 'BT_SEL' | 'BT_DISC';
// OUT_NONE is main only (docs/zmk/behaviors.md §2), never offered for v0.3.
export type OutputCommand = 'OUT_TOG' | 'OUT_USB' | 'OUT_BLE';

/** `kind` is the ZMK behavior label without `&` (docs/zmk/behaviors.md §1). */
export type Binding =
  | { readonly kind: 'kp'; readonly key: KeyStroke }
  | { readonly kind: 'mt'; readonly hold: KeyStroke; readonly tap: KeyStroke }
  | { readonly kind: 'sk'; readonly key: KeyStroke }
  | { readonly kind: 'kt'; readonly key: KeyStroke }
  | { readonly kind: 'trans' }
  | { readonly kind: 'none' }
  | { readonly kind: 'caps_word' }
  | { readonly kind: 'key_repeat' }
  | { readonly kind: 'gresc' }
  | { readonly kind: 'bt'; readonly command: BluetoothCommand }
  | { readonly kind: 'bt'; readonly command: BluetoothProfileCommand; readonly profile: number }
  | { readonly kind: 'out'; readonly command: OutputCommand }
  | { readonly kind: 'sys_reset' }
  | { readonly kind: 'bootloader' }
  | {
      readonly kind: 'tap_dance';
      /** Ordered tap actions, first tap first; never empty (spec 005 data-model.md). */
      readonly taps: readonly KeyStroke[];
      /** Resolving pause in ms (spec 005 data-model.md: int, 0–5000, default 200). */
      readonly tappingTermMs: number;
    }
  | {
      readonly kind: 'mod_morph';
      readonly normal: KeyStroke;
      readonly morphed: KeyStroke;
      /** Trigger modifiers, unique and in MODIFIERS order; never empty. */
      readonly mods: readonly Modifier[];
    };

export type BehaviorId = Binding['kind'];

/** A key, drawn on the Schematic as a switch seen from above; position is its top-left corner. */
export type Key = {
  readonly id: string;
  readonly xU: number;
  readonly yU: number;
};

export type KeyPin = 1 | 2;

export type WirePoint = {
  readonly xU: number;
  readonly yU: number;
};

export type WireEnd =
  | { readonly kind: 'key-pin'; readonly keyId: string; readonly pin: KeyPin }
  | { readonly kind: 'junction'; readonly wireId: string; readonly at: WirePoint }
  | { readonly kind: 'free'; readonly at: WirePoint; readonly boardPin?: number };

export type WireEndSide = 'start' | 'end';

export type Wire = {
  readonly id: string;
  readonly start: WireEnd;
  readonly end: WireEnd;
  /** The user's clicks; the drawn path is derived and always orthogonal (003 R4). */
  readonly bends: readonly WirePoint[];
};

export type CrossingRef = {
  /** Sorted ascending. */
  readonly wireIds: readonly [string, string];
  /** 0-based order along the path of `wireIds[0]`. */
  readonly ordinal: number;
};

export type ValidationCode =
  | 'shield-name-empty'
  | 'shield-name-invalid'
  | 'keyboard-name-too-long'
  | 'key-overlap'
  | 'key-pin-unconnected'
  | 'wire-end-unconnected'
  | 'board-pin-conflict'
  | 'board-pins-shorted'
  | 'key-shorted'
  | 'binding-keycode-unknown'
  | 'binding-profile-out-of-range';

export type ValidationIssue = {
  readonly code: ValidationCode;
  readonly message: string;
  readonly path: readonly (string | number)[];
};

export type Result<Value, Failure> =
  | { readonly ok: true; readonly value: Value }
  | { readonly ok: false; readonly error: Failure };
