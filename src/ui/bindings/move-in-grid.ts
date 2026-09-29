export type GridPosition = { readonly row: number; readonly index: number };

/** Arrow keys in the mini keyboard; up/down keep the column index, clamped to the row. */
export function moveInGrid(input: {
  readonly key: string;
  readonly rowLengths: readonly number[];
  readonly from: GridPosition;
}): GridPosition | undefined {
  const { key, rowLengths, from } = input;
  const lastIndexOf = (row: number) => Math.max((rowLengths[row] ?? 1) - 1, 0);
  switch (key) {
    case 'ArrowLeft': {
      return { row: from.row, index: Math.max(from.index - 1, 0) };
    }
    case 'ArrowRight': {
      return { row: from.row, index: Math.min(from.index + 1, lastIndexOf(from.row)) };
    }
    case 'ArrowUp':
    case 'ArrowDown': {
      const row = Math.min(
        Math.max(from.row + (key === 'ArrowUp' ? -1 : 1), 0),
        rowLengths.length - 1,
      );
      return { row, index: Math.min(from.index, lastIndexOf(row)) };
    }
    case 'Home': {
      return { row: from.row, index: 0 };
    }
    case 'End': {
      return { row: from.row, index: lastIndexOf(from.row) };
    }
    default: {
      return undefined;
    }
  }
}
