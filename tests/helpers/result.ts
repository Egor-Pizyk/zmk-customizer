import type { Result } from '@domain';

export function getResultValue<Value, Failure>(result: Result<Value, Failure>): Value {
  if (!result.ok) {
    throw new Error(`Expected success: ${JSON.stringify(result.error)}`);
  }
  return result.value;
}

export function getResultError<Value, Failure>(result: Result<Value, Failure>): Failure {
  if (result.ok) {
    throw new Error('Expected failure');
  }
  return result.error;
}
