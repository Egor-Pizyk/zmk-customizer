import type { Key, KeyPin } from '../types';

export function getKeyDiodeState(key: Key | undefined, pin: KeyPin) {
  return {
    isPresent: key?.diode?.pin === pin,
    isDisabled: key === undefined || (key.diode !== undefined && key.diode.pin !== pin),
  };
}
