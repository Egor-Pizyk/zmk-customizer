type PartsTableHeadProps = {
  readonly columns: readonly string[];
  readonly hasActions: boolean;
};

export function PartsTableHead({ columns, hasActions }: PartsTableHeadProps) {
  return (
    <thead className="text-xs text-text-muted">
      <tr>
        {columns.map((column) => (
          <th key={column} scope="col">
            {column}
          </th>
        ))}
        {hasActions ? (
          <th scope="col">
            <span className="sr-only">Actions</span>
          </th>
        ) : undefined}
      </tr>
    </thead>
  );
}
