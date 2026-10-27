import { useState } from 'react';
import type { ComponentProps, CSSProperties, ReactNode } from 'react';
import { usePreferences } from '@ui/preferences';
import { SchematicPreviewBar } from './schematic-preview-bar';
import { EditorResizeHandle } from './editor-resize-handle';

type SchematicEditorPanelProps = {
  readonly children: ReactNode;
  readonly preview: ComponentProps<typeof SchematicPreviewBar>;
};

export function SchematicEditorPanel({ children, preview }: SchematicEditorPanelProps) {
  const resize = useEditorWidth();
  return (
    <section
      data-onboarding-target="schematic-editors"
      aria-label="Schematic editors"
      style={resize.style}
      className="schematic-editor-pane"
    >
      <EditorResizeHandle {...resize.handlers} />
      <div className="border-b border-border p-2 xl:ml-6">
        <h2 className="font-semibold">Editors</h2>
      </div>
      <div id="schematic-editor-content" className="min-h-0 overflow-auto xl:ml-6">
        {children}
      </div>
      <SchematicPreviewBar {...preview} />
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
