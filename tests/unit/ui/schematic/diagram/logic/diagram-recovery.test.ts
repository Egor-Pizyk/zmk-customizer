// @vitest-environment jsdom
import { expect, it } from 'vitest';
import { runDiagramOperation } from '@ui/schematic/diagram/logic';

it.each(['InvalidStateError', 'NotSupportedError'])(
  'classifies external %s without retrying',
  (name) => {
    let calls = 0;
    const result = runDiagramOperation(() => {
      calls += 1;
      throw new DOMException('Renderer unavailable', name);
    });
    expect(result).toEqual({ ok: false });
    expect(calls).toBe(1);
  },
);

it('propagates programmer and unclassified external failures', () => {
  const programmer = new TypeError('Invalid descriptor');
  expect(() =>
    runDiagramOperation(() => {
      throw programmer;
    }),
  ).toThrow(programmer);
  const unknown = new DOMException('Unexpected', 'SyntaxError');
  expect(() =>
    runDiagramOperation(() => {
      throw unknown;
    }),
  ).toThrow(unknown);
});

it('returns the external result without changing it', () => {
  const value = { id: 'rendered' };
  expect(runDiagramOperation(() => value)).toEqual({ ok: true, value });
});
