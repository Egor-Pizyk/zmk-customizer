import { Button } from '@ui/components/components';

type LayoutPreviewButtonsProps = {
  readonly hasPreview: boolean;
  readonly canApply: boolean;
  readonly onApply: () => void;
  readonly onCancel: () => void;
};

export function LayoutPreviewButtons({
  hasPreview,
  canApply,
  onApply,
  onCancel,
}: LayoutPreviewButtonsProps) {
  function handleApplyClick() {
    onApply();
  }
  function handleCancelClick() {
    onCancel();
  }
  return (
    <div className="flex flex-wrap gap-2">
      <Button isDisabled={!hasPreview || !canApply} onClick={handleApplyClick} size="sm">
        Apply layout
      </Button>
      <Button isDisabled={!hasPreview} onClick={handleCancelClick} size="sm">
        Cancel preview
      </Button>
    </div>
  );
}
