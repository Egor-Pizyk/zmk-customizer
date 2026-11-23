// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { useProject } from '@ui/project/logic';
import { createDiagramGestureSession } from '@ui/schematic/diagram/logic';
import { moveKey } from '@domain/keys';
import { saveProject, loadProject } from '@storage/project';
import { ProjectHarness } from '../../../helpers/project-harness';
import { buildProject } from '../../../helpers/build-project';
import { getDefinedValue } from '../../../helpers/defined-value';

const initial = buildProject({ keys: [{ id: 'k1', xU: 0, yU: 0 }] });
const move = (project: typeof initial) =>
  moveKey(project, { keyId: 'k1', position: { xU: 1, yU: 0 } });

it('commits one accepted history/save transition and ignores repeated completion', () => {
  saveProject(initial);
  const save = vi.spyOn(Storage.prototype, 'setItem');
  const { result } = renderHook(useProject, { wrapper: ProjectHarness });
  const project = result.current.project;
  const session = createDiagramGestureSession(result.current.importSession.getRevision);
  const token = getDefinedValue(session.start({ project, pointerId: 1, isReadOnly: false }));
  const finish = { token, project, pointerId: 1, isReadOnly: false, change: move };
  const change = getDefinedValue(session.finish(finish));
  act(() => {
    result.current.commit(change);
  });
  const moved = result.current.project;
  expect(loadProject().project.keys[0]?.xU).toBe(1);
  expect(save.mock.calls.filter(([key]) => key === 'zmk-customizer:project')).toHaveLength(1);
  expect(session.finish(finish)).toBeUndefined();
  act(() => {
    result.current.undo();
  });
  expect(result.current.project).toBe(project);
  act(() => {
    result.current.redo();
  });
  expect(result.current.project).toBe(moved);
});

it('rejects an old completion after batched Undo/Redo before any diagram effect', () => {
  saveProject(initial);
  const { result } = renderHook(useProject, { wrapper: ProjectHarness });
  act(() => {
    result.current.commit(move);
  });
  const project = result.current.project;
  const imports = result.current.importSession;
  const pending = imports.begin();
  const session = createDiagramGestureSession(imports.getRevision);
  const token = getDefinedValue(session.start({ project, pointerId: 1, isReadOnly: false }));
  const revision = imports.getRevision();
  act(() => {
    result.current.undo();
    result.current.redo();
    expect(imports.getRevision()).toBe(revision + 2);
  });
  expect(result.current.project).toBe(project);
  expect(
    session.finish({ token, project, pointerId: 1, isReadOnly: false, change: move }),
  ).toBeUndefined();
  expect(imports.getRequest()).toBe(pending.request);
  expect(loadProject().project).toEqual(project);
});
