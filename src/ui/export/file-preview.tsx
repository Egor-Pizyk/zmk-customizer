import type { GeneratedFile } from '@generators';
import { Button } from '@ui/components';
import type { useExportActions } from './use-export-actions';

type FilePreviewProps = {
  readonly files: readonly GeneratedFile[];
  readonly actions: ReturnType<typeof useExportActions>;
};
export function FilePreview({ files, actions }: FilePreviewProps) {
  return (
    <section aria-labelledby="export-files-title" className="flex min-w-0 flex-col gap-3">
      <h2 className="text-base font-semibold" id="export-files-title">
        Generated repository files
      </h2>
      {files.map((file) => (
        <PreviewFile key={file.path} file={file} actions={actions} />
      ))}
    </section>
  );
}

function PreviewFile({
  file,
  actions,
}: {
  readonly file: GeneratedFile;
  readonly actions: ReturnType<typeof useExportActions>;
}) {
  return (
    <details
      className="min-w-0 rounded-lg border border-border bg-surface-raised"
      key={file.path}
      open
    >
      <summary className="cursor-pointer rounded-md p-3 font-mono text-xs break-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus">
        {file.path}
      </summary>
      <FileActions file={file} actions={actions} />
      <pre
        aria-label={file.path}
        className="overflow-auto p-3 font-mono text-xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        tabIndex={0}
      >
        <code>{file.content}</code>
      </pre>
    </details>
  );
}

function FileActions({
  file,
  actions,
}: {
  readonly file: GeneratedFile;
  readonly actions: ReturnType<typeof useExportActions>;
}) {
  return (
    <div className="flex flex-wrap gap-2 border-t border-border px-3 pt-3">
      <Button
        size="sm"
        variant="secondary"
        aria-label={`Copy ${file.path}`}
        onClick={() => {
          void actions.handleFileCopy(file);
        }}
      >
        Copy file
      </Button>
      <Button
        size="sm"
        variant="secondary"
        aria-label={`Download ${file.path}`}
        onClick={() => {
          actions.handleFileDownload(file);
        }}
      >
        Download file
      </Button>
    </div>
  );
}
