import { expect, it } from 'vitest';
import { changeController } from '@domain/project';
import { editWiring } from '@domain/wiring/editing';
import { reverseKeyDiode, toggleKeyDiode } from '@domain/diodes';
import { toggleCrossingInsulation } from '@domain/crossings';
import { CONTROLLER_BOARDS, getControllerBoard } from '@catalog/controllers';
import { buildLockedWiringProject } from '../../../helpers/symmetric-wiring-fixtures';

it('cannot reconnect a locked terminal through wiring or controller edits', () => {
  const base = buildLockedWiringProject();
  expect(changeController(base, { boardId: 'seeeduino_xiao_ble', boards: CONTROLLER_BOARDS })).toBe(
    base,
  );
  const edit = editWiring(base, {
    board: getControllerBoard(base.controllerId),
    kind: 'pin',
    terminalId: 't0',
    boardPin: 7,
  });
  expect(edit.ok).toBe(false);
});

it('cannot bypass protection through diode or crossing changes', () => {
  const base = buildLockedWiringProject();
  expect(reverseKeyDiode(base, { keyId: 'k0' })).toBe(base);
  expect(toggleKeyDiode(base, { keyId: 'k0', pin: 1 })).toBe(base);
  expect(toggleCrossingInsulation(base, { ref: { wireIds: ['w0', 'w2'], ordinal: 0 } })).toBe(base);
});
