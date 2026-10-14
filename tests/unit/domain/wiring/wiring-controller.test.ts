import { changeController } from '@domain/project';
import { setWireEndBoardPin } from '@domain/wires/editing';
import { deriveWiring } from '@domain/wiring/matrix';
import { editWiring } from '@domain/wiring/editing';
import { expect, it } from 'vitest';
import { buildWiringProject, wiringBoard } from '../../../helpers/wiring-project';
import { getControllerFixtures } from '../../../helpers/controller-fixtures';
import { getDefinedValue } from '../../../helpers/defined-value';
import { getResultValue } from '../../../helpers/result';

it('Parts pin edits change shared terminals for every connected branch and clear dropped pins', () => {
  const project = buildWiringProject();
  const edited = setWireEndBoardPin(project, { wireId: 'w0', side: 'end', boardPin: 21 });
  expect(getResultValue(deriveWiring(edited, wiringBoard())).rowPins[0]).toBe(21);
  expect(edited.wires).toEqual(project.wires);
  const cleared = setWireEndBoardPin(edited, { wireId: 'w0', side: 'end', boardPin: undefined });
  expect(getDefinedValue(getDefinedValue(cleared.wiring).terminals[0]).boardPin).toBeUndefined();
});
it('preserves same-family pin indices and clears another connector family with provenance', () => {
  const project = buildWiringProject('direct');
  const boards = getControllerFixtures().boards;
  const sameFamily = changeController(project, { boardId: 'sparkfun_pro_micro_rp2040', boards });
  expect(sameFamily.wiring).toEqual(project.wiring);
  const xiao = changeController(project, { boardId: 'seeeduino_xiao_ble', boards });
  expect(getDefinedValue(xiao.wiring).terminals[0]?.droppedBoardPin).toContain('nice!nano v2');
  expect(getDefinedValue(getDefinedValue(xiao.wiring).terminals[0]).boardPin).toBeUndefined();
  const reassigned = getResultValue(
    editWiring(xiao, {
      kind: 'pin',
      terminalId: getDefinedValue(getDefinedValue(xiao.wiring).terminals[0]).id,
      boardPin: 0,
      board: getDefinedValue(boards.find((board) => board.id === 'seeeduino_xiao_ble')),
    }),
  );
  expect(getDefinedValue(reassigned.wiring).terminals[0]?.droppedBoardPin).toBeUndefined();
});
it('ground cannot be assigned a GPIO through Parts', () => {
  const project = buildWiringProject('direct');
  const groundWire = getDefinedValue(project.wires[1]);
  expect(
    setWireEndBoardPin(project, { wireId: groundWire.id, side: 'end', boardPin: 0 }).wiring,
  ).toEqual(project.wiring);
  expect(
    getResultValue(
      editWiring(project, { kind: 'direction', direction: 'row2col', board: wiringBoard() }),
    ).keys,
  ).toEqual(project.keys);
});

it('retains dropped pin provenance when resizing the same axes', () => {
  const boards = getControllerFixtures().boards;
  const board = getDefinedValue(boards.find((entry) => entry.id === 'seeeduino_xiao_ble'));
  const dropped = changeController(buildWiringProject(), { boardId: board.id, boards });
  const resized = getResultValue(
    editWiring(dropped, { kind: 'dimensions', half: 'left', rows: 3, cols: 3, board }),
  );
  const originalTerminal = getDefinedValue(getDefinedValue(dropped.wiring).terminals[0]);
  expect(
    getDefinedValue(resized.wiring).terminals.find(
      (terminal) => terminal.id === originalTerminal.id,
    ),
  ).toEqual(originalTerminal);
});
