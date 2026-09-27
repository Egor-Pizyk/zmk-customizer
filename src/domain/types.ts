export type Project = {
  readonly schemaVersion: 1;
  readonly name: string;
  /** User override of the technical name; absent = derived from `name` (spec 002 FR-012a). */
  readonly shieldName?: string;
};

export type ValidationCode = 'shield-name-empty' | 'shield-name-invalid' | 'keyboard-name-too-long';

export type ValidationIssue = {
  readonly code: ValidationCode;
  readonly message: string;
  readonly path: readonly (string | number)[];
};

export type Result<Value, Failure> =
  | { readonly ok: true; readonly value: Value }
  | { readonly ok: false; readonly error: Failure };
