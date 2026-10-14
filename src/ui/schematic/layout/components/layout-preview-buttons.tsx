import { Button } from '@ui/components/components';

type LayoutPreviewButtonsProps = {
  readonly hasPreview: boolean;
  readonly onApply: () => void;
  readonly onCancel: () => void;
};

export function LayoutPreviewButtons({ hasPreview, onApply, onCancel }: LayoutPreviewButtonsProps) {
  function handleApplyClick() {
    onApply();
  }
  function handleCancelClick() {
    onCancel();
  }
  return (
    <div className="flex gap-2">
      <Button isDisabled={!hasPreview} onClick={handleApplyClick} size="sm">
        Apply layout
      </Button>
      <Button isDisabled={!hasPreview} onClick={handleCancelClick} size="sm">
        Cancel preview
      </Button>
    </div>
  );
}
