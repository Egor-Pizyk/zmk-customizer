import { useId } from 'react';
import type { ReactNode } from 'react';
import { toLayerNodeName } from '@domain';
import type { Layer } from '@domain';
import { Button, PlusIcon, Tabs } from '@ui/components';
import type { ButtonVariant } from '@ui/components';
import { DraftTextField } from '@ui/shell';
import type { LayerActions } from '../interaction/use-layer-actions';

type LayerBarProps = {
  readonly layers: readonly Layer[];
  readonly actions: LayerActions;
  /** Shared with the tab panel: `toTabId(tabIdPrefix, layer.id)` labels it. */
  readonly tabIdPrefix: string;
  readonly panelId: string;
};

// Layer tabs above the canvas, then the open layer's name and order (spec 007 contracts/ui.md).
export function LayerBar(props: LayerBarProps) {
  const { layers, actions } = props;
  const headingId = useId();
  return (
    <section
      aria-labelledby={headingId}
      className="flex shrink-0 flex-wrap items-end gap-x-6 gap-y-2 border-b border-border bg-surface-raised px-4 py-2"
      data-layer-bar
    >
      <h2 className="sr-only" id={headingId}>
        Layers
      </h2>
      <LayerTabs {...props} />
      <div className="flex flex-wrap items-end gap-2">
        {/* Fixed width: a long name problem wraps instead of pushing the buttons aside. */}
        <div className="w-64">
          <LayerNameField actions={actions} layer={layers[actions.layerIndex]} />
        </div>
        <LayerOrderButtons actions={actions} />
      </div>
    </section>
  );
}

function LayerTabs({ layers, actions, tabIdPrefix, panelId }: LayerBarProps) {
  const items = layers.map((layer, layerIndex) => ({
    id: layer.id,
    label: `${layerIndex} ${layer.name}`,
    ...(layerIndex === 0 ? { detail: 'always on' } : {}),
    issuePath: `layers.${layerIndex}`,
  }));
  return (
    <div className="flex min-w-0 items-center gap-2">
      <Tabs
        idPrefix={tabIdPrefix}
        items={items}
        label="Open layer"
        onSelect={actions.handleLayerOpen}
        panelId={panelId}
        selectedIndex={actions.layerIndex}
      />
      <LayerButton onClick={actions.handleLayerAdd} reason={actions.blockReasons.add}>
        <PlusIcon />
        Add layer
      </LayerButton>
    </div>
  );
}

type LayerNameFieldProps = {
  readonly layer: Layer | undefined;
  readonly actions: LayerActions;
};

// Keyed by layer: switching layers drops an uncommitted draft of the previous name.
function LayerNameField({ layer, actions }: LayerNameFieldProps) {
  const nodeName = toLayerNodeName(layer?.name ?? '');
  return (
    <DraftTextField
      description={`Keymap node: ${nodeName === '' ? 'none' : nodeName}`}
      error={actions.nameError}
      issuePath={`layers.${actions.layerIndex}.name`}
      key={layer?.id}
      label="Layer name"
      onCommit={actions.handleLayerRename}
      value={layer?.name ?? ''}
    />
  );
}

function LayerOrderButtons({ actions }: { readonly actions: LayerActions }) {
  const { blockReasons } = actions;

  function handleMoveLeftClick() {
    actions.handleLayerMove(-1);
  }

  function handleMoveRightClick() {
    actions.handleLayerMove(1);
  }

  return (
    <>
      <LayerButton onClick={handleMoveLeftClick} reason={blockReasons.moveLeft}>
        Move left
      </LayerButton>
      <LayerButton onClick={handleMoveRightClick} reason={blockReasons.moveRight}>
        Move right
      </LayerButton>
      <LayerButton
        onClick={actions.handleLayerDelete}
        reason={blockReasons.delete}
        variant="danger"
      >
        Delete layer
      </LayerButton>
    </>
  );
}

type LayerButtonProps = {
  /** Why the action is unavailable; undefined = available. */
  readonly reason: string | undefined;
  readonly variant?: ButtonVariant;
  readonly onClick: () => void;
  readonly children: ReactNode;
};

function LayerButton({
  reason,
  variant = 'secondary',
  onClick: handleClick,
  children,
}: LayerButtonProps) {
  return (
    <Button
      hint={reason}
      isDisabled={reason !== undefined}
      onClick={handleClick}
      size="sm"
      variant={variant}
    >
      {children}
    </Button>
  );
}
