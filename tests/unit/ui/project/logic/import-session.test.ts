import { expect, it } from 'vitest';
import { createImportSession } from '@ui/project/logic';

it('reads revision without advancing request identity or import ownership', () => {
  const session = createImportSession();
  const pending = session.begin();
  expect(session.getRevision()).toBe(0);
  expect(session.getRevision()).toBe(0);
  expect(session.getRequest()).toBe(pending.request);
  expect(session.status(pending)).toBe('current');
  session.invalidate();
  session.invalidate();
  expect(session.getRevision()).toBe(2);
  expect(session.getRequest()).toBe(pending.request);
  expect(session.status(pending)).toBe('changed');
});
