// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { expect, it, vi } from 'vitest';
import { getControllerBoard } from '@catalog/controllers';
import { ProjectProvider } from '@ui/project/components';
import { useProject } from '@ui/project/logic';
import { useWiringPreview } from '@ui/schematic/wiring/logic';
import { buildProject } from '../../../helpers/build-project';
import { latestRoutingWorker, PendingRoutingWorker } from '../../../helpers/routing-worker';

const SOURCE = {
  ...buildProject({}),
  wiring: { kind: 'matrix', topology: 'unibody', diodeDirection: 'col2row', terminals: [] },
} as const;
function ProjectWrapper({ children }: { readonly children: ReactNode }) {
  return (
    <ProjectProvider initialLoad={{ project: SOURCE, status: { kind: 'ok' } }}>
      {children}
    </ProjectProvider>
  );
}
function usePreview() {
  const context = useProject();
  return {
    context,
    preview: useWiringPreview(context.project, context.commit, () => {
      /* No other editor in this fixture. */
    }),
  };
}

it('retains the exact main-thread Project for a no-change clone without save or history', () => {
  vi.stubGlobal('Worker', PendingRoutingWorker);
  const setItem = vi.spyOn(Storage.prototype, 'setItem');
  const { result } = renderHook(usePreview, { wrapper: ProjectWrapper });
  const original = result.current.context.project;
  act(() => {
    result.current.preview.handleEdit({
      kind: 'direction',
      direction: 'col2row',
      board: getControllerBoard('nice_nano_v2'),
    });
  });
  act(() => {
    latestRoutingWorker().complete();
  });
  expect(result.current.preview.message).toBe('No wiring changes needed.');
  expect(result.current.context.project).toBe(original);
  expect(result.current.preview.previewProject).toBe(original);
  act(() => {
    result.current.preview.handleApply();
    result.current.preview.handleCancel();
  });
  expect(result.current.context.project).toBe(original);
  expect(result.current.context.canUndo).toBe(false);
  expect(setItem).not.toHaveBeenCalled();
});

it('rejects late no-change after edit and Undo even when the original reference returns', () => {
  vi.stubGlobal('Worker', PendingRoutingWorker);
  const { result } = renderHook(usePreview, { wrapper: ProjectWrapper });
  const original = result.current.context.project;
  act(() => {
    result.current.preview.handleEdit({
      kind: 'direction',
      direction: 'col2row',
      board: getControllerBoard('nice_nano_v2'),
    });
  });
  const worker = latestRoutingWorker();
  act(() => {
    result.current.context.commit((project) => ({ ...project, name: 'Changed' }));
  });
  act(() => {
    result.current.context.undo();
  });
  expect(result.current.context.project).toBe(original);
  act(() => {
    worker.complete();
  });
  expect(result.current.preview.phase).toBe('stale');
  expect(result.current.preview.canApply).toBe(false);
  expect(result.current.context.project).toBe(original);
});
