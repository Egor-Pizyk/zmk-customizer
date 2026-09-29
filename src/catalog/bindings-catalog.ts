import type { BindingsCatalog } from '../domain/validate-bindings';
import { BLUETOOTH_PROFILE_COUNT } from './bluetooth-commands';
import { keycodeByName } from './keycodes';

/** Catalog facts validateProject needs (spec 004 R8). */
export const BINDINGS_CATALOG: BindingsCatalog = {
  keycodeNames: new Set(keycodeByName.keys()),
  bluetoothProfileCount: BLUETOOTH_PROFILE_COUNT,
};
