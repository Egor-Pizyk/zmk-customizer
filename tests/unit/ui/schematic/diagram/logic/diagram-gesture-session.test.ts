import { expect, it } from 'vitest';
import { createDiagramGestureSession } from '@ui/schematic/diagram/logic';
import { createImportSession } from '@ui/project/logic';
import { moveKey } from '@domain/keys';
import { buildProject } from '../../../../../helpers/build-project';
import { getDefinedValue } from '../../../../../helpers/defined-value';

const project = buildProject({ keys: [{ id: 'k1', xU: 0, yU: 0 }] });
const move = (current: typeof project) =>
  moveKey(current, { keyId: 'k1', position: { xU: 1, yU: 0 } });

it('consumes completion before dispatch but permits pure updater reevaluation', () => {
  const revision = createImportSession();
  const session = createDiagramGestureSession(revision.getRevision);
  const token = getDefinedValue(session.start({ project, pointerId: 1, isReadOnly: false }));
  const finish = { token, project, pointerId: 1, isReadOnly: false, change: move };
  const change = getDefinedValue(session.finish(finish));
  expect(session.finish(finish)).toBeUndefined();
  expect(change(project).keys[0]?.xU).toBe(1);
  expect(change(project)).toEqual(change(project));
  expect(change({ ...project })).toEqual(project);
});

it('rejects batched ABA, cancellation, stale completion and pending disposal', () => {
  const revision = createImportSession();
  const session = createDiagramGestureSession(revision.getRevision);
  const token = getDefinedValue(session.start({ project, pointerId: 1, isReadOnly: false }));
  revision.invalidate();
  revision.invalidate();
  expect(
    session.finish({ token, project, pointerId: 1, isReadOnly: false, change: move }),
  ).toBeUndefined();
  const latest = getDefinedValue(session.start({ project, pointerId: 1, isReadOnly: false }));
  const change = getDefinedValue(
    session.finish({ token: latest, project, pointerId: 1, isReadOnly: false, change: move }),
  );
  session.cancel();
  expect(change(project)).toBe(project);
  expect(session.isCurrent({ project, token: latest })).toBe(false);
});

it('does not let mismatched pointers or old generations consume a newer session', () => {
  const session = createDiagramGestureSession(() => 0);
  const old = getDefinedValue(session.start({ project, pointerId: 1, isReadOnly: false }));
  const current = getDefinedValue(session.start({ project, pointerId: 2, isReadOnly: false }));
  expect(
    session.finish({ token: old, project, pointerId: 1, isReadOnly: false, change: move }),
  ).toBeUndefined();
  expect(
    session.finish({ token: current, project, pointerId: 1, isReadOnly: false, change: move }),
  ).toBeUndefined();
  expect(session.isCurrent({ project, token: current })).toBe(true);
  expect(
    session.finish({ token: current, project, pointerId: 2, isReadOnly: false, change: move }),
  ).toBeTypeOf('function');
});

it('blocks read-only input/completion without superseding an import request', () => {
  const revision = createImportSession();
  const pending = revision.begin();
  const session = createDiagramGestureSession(revision.getRevision);
  expect(session.start({ project, pointerId: 1, isReadOnly: true })).toBeUndefined();
  const token = getDefinedValue(session.start({ project, pointerId: 1, isReadOnly: false }));
  expect(
    session.finish({ token, project, pointerId: 1, isReadOnly: true, change: move }),
  ).toBeUndefined();
  session.cancel();
  expect(revision.getRequest()).toBe(pending.request);
  expect(revision.status(pending)).toBe('current');
});
