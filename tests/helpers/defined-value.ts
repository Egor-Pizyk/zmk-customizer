export function getDefinedValue<Value>(value: Value | null | undefined): Value {
  if (value === undefined || value === null) {
    throw new Error('Missing test value');
  }
  return value;
}
