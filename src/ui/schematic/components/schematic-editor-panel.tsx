import { useEffect, useRef, useState } from 'react';
import type { ReactNode, RefObject } from 'react';
import { Button } from '@ui/components/components';
import { REVEAL_ISSUE_EVENT } from '@ui/issues';

type SchematicEditorPanelProps = {
  readonly children: ReactNode;
  readonly onDismissPreview: () => void;
};

export function SchematicEditorPanel({ children, onDismissPreview }: SchematicEditorPanelProps) {
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
  return (
    <section
      aria-label="Schematic editors"
      className={mode === 'open' ? 'schematic-editor-pane' : 'shrink-0'}
    >
      <EditorHeader mode={mode} opener={opener} onExpand={handleExpand} onClose={handleClose} />
      <div id="schematic-editor-content" className="min-h-0 overflow-auto" hidden={mode !== 'open'}>
        {children}
      </div>
    </section>
  );
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
    <div className="flex flex-wrap items-center gap-2 border-b border-border p-2">
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
