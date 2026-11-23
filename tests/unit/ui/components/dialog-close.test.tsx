// @vitest-environment jsdom
import { fireEvent, render } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import { installPlatformShims } from '../../../helpers/app-platform';
import { Dialog } from '@ui/components/components';

beforeEach(installPlatformShims);

it('ignores a delayed native close event from the preceding opening', () => {
  const handleClose = vi.fn<() => void>();
  const view = render(
    <Dialog isOpen onClose={handleClose} title="Review">
      Content
    </Dialog>,
  );
  const dialog = view.getByRole('dialog');
  view.rerender(
    <Dialog isOpen={false} onClose={handleClose} title="Review">
      Content
    </Dialog>,
  );
  view.rerender(
    <Dialog isOpen onClose={handleClose} title="Review">
      Content
    </Dialog>,
  );
  handleClose.mockClear();
  fireEvent(dialog, new Event('close'));
  expect(dialog).toHaveProperty('open', true);
  expect(handleClose).not.toHaveBeenCalled();
});

it('reports a native dismissal after the dialog has actually closed', () => {
  const handleClose = vi.fn<() => void>();
  const view = render(
    <Dialog isOpen onClose={handleClose} title="Review">
      Content
    </Dialog>,
  );
  const dialog = view.getByRole('dialog');
  dialog.removeAttribute('open');
  fireEvent(dialog, new Event('close'));
  expect(handleClose).toHaveBeenCalledExactlyOnceWith();
});
