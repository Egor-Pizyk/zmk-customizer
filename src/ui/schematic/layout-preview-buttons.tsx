import type { LayoutEdit } from '../../domain/edit-layout';
import { Button } from '../components/button';

type LayoutPreviewButtonsProps = {
  readonly edit: LayoutEdit;
  readonly hasPreview: boolean;
  readonly onPreview: (edit: LayoutEdit) => void;
  readonly onApply: () => void;
  readonly onCancel: () => void;
};

export function LayoutPreviewButtons({
  edit,
  hasPreview,
  onPreview,
  onApply,
  onCancel,
}: LayoutPreviewButtonsProps) {
  function handlePreviewClick() {
    onPreview(edit);
  }
  function handleApplyClick() {
    onApply();
  }
  function handleCancelClick() {
    onCancel();
  }
  return (
    <div className="flex gap-2">
      <Button onClick={handlePreviewClick} size="sm">
        Preview layout
      </Button>
      <Button isDisabled={!hasPreview} onClick={handleApplyClick} size="sm">
        Apply layout
      </Button>
      <Button isDisabled={!hasPreview} onClick={handleCancelClick} size="sm">
        Cancel preview
      </Button>
    </div>
  );
}
