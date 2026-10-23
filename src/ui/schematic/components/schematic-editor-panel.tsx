import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, ReactNode, RefObject } from 'react';
import { Button } from '@ui/components/components';
import { usePreferences } from '@ui/preferences';
import { EditorResizeHandle } from './editor-resize-handle';
import { REVEAL_ISSUE_EVENT } from '@ui/issues';

type SchematicEditorPanelProps = {
  readonly children: ReactNode;
  readonly onDismissPreview: () => void;
};

export function SchematicEditorPanel({ children, onDismissPreview }: SchematicEditorPanelProps) {
  const resize = useEditorWidth();
  const mode = useEditorMode(onDismissPreview);
  return (
    <section
      aria-label="Schematic editors"
      style={resize.style}
      className={mode.mode === 'open' ? 'schematic-editor-pane' : 'shrink-0'}
    >
      {mode.mode === 'open' ? <EditorResizeHandle {...resize.handlers} /> : undefined}
      <EditorHeader {...mode} />
      <div
        id="schematic-editor-content"
        className="min-h-0 overflow-auto xl:mr-6"
        hidden={mode.mode !== 'open'}
      >
        {children}
      </div>
    </section>
  );
}

function useEditorWidth() {
  const { preferences, changePreferences } = usePreferences();
  const [draftWidthPx, setDraftWidthPx] = useState<number | undefined>();
  const style: CSSProperties & { readonly '--schematic-editor-width': string } = {
    '--schematic-editor-width': `${draftWidthPx ?? preferences.schematicEditorWidthPx}px`,
  };
  return {
    style,
    handlers: {
      onDraft: setDraftWidthPx,
      onCancel: () => {
        setDraftWidthPx(undefined);
      },
      onCommit: (widthPx: number) => {
        setDraftWidthPx(undefined);
        changePreferences({ schematicEditorWidthPx: widthPx });
      },
    },
  };
}

function useEditorMode(onDismissPreview: () => void) {
  const [mode, setMode] = useState<'open' | 'collapsed' | 'closed'>('open');
  const opener = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    function reveal() {
      setMode('open');
    }
    document.addEventListener(REVEAL_ISSUE_EVENT, reveal);
    return () => {
      document.removeEventListener(REVEAL_ISSUE_EVENT, reveal);
    };
  }, []);
  function handleExpand() {
    onDismissPreview();
    setMode(mode === 'open' ? 'collapsed' : 'open');
    requestAnimationFrame(() => {
      opener.current?.focus();
    });
  }
  function handleClose() {
    onDismissPreview();
    setMode('closed');
    requestAnimationFrame(() => {
      opener.current?.focus();
    });
  }
  return { mode, opener, onExpand: handleExpand, onClose: handleClose };
}

function EditorHeader({
  mode,
  opener,
  onExpand: handleExpand,
  onClose: handleClose,
}: {
  readonly mode: 'open' | 'collapsed' | 'closed';
  readonly opener: RefObject<HTMLButtonElement | null>;
  readonly onExpand: () => void;
  readonly onClose: () => void;
}) {
  const labels = {
    open: 'Collapse editors',
    collapsed: 'Expand editors',
    closed: 'Open editors',
  } as const;
  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-border p-2 xl:mr-6">
      <h2 className="font-semibold">Editors</h2>
      <Button
        ref={opener}
        aria-expanded={mode === 'open'}
        aria-controls="schematic-editor-content"
        onClick={handleExpand}
        size="sm"
      >
        {labels[mode]}
      </Button>
      {mode === 'closed' ? undefined : (
        <Button onClick={handleClose} size="sm">
          Close editors
        </Button>
      )}
    </div>
  );
}
