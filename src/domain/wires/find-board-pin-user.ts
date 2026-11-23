import { createBoardPinUserLookup } from './create-board-pin-user-lookup';
import type { BoardPinUserQuery } from './create-board-pin-user-lookup';
import type { Project } from '@domain';

/** Index of the first wire whose free end uses `boardPin`, other than `except` (FR-020). */
export function findBoardPinUser(project: Project, input: BoardPinUserQuery): number | undefined {
  return createBoardPinUserLookup(project)(input);
}
