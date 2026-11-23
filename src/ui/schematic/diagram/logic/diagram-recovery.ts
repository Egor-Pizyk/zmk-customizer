/** Guard only external renderer calls; construct application input before invoking this. */
export function runDiagramOperation<Result>(
  operation: () => Result,
): { readonly ok: true; readonly value: Result } | { readonly ok: false } {
  try {
    return { ok: true, value: operation() };
  } catch (error) {
    if (
      error instanceof DOMException &&
      (error.name === 'InvalidStateError' || error.name === 'NotSupportedError')
    ) {
      return { ok: false };
    }
    throw error;
  }
}
