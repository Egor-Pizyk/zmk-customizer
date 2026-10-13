import { Component } from 'react';
import type { ReactNode } from 'react';
import { readStoredProjectText } from '@storage/project';
import { Button } from '@ui/components';
import { downloadTextFile } from '@ui/downloads';

type ErrorBoundaryProps = {
  readonly children: ReactNode;
};

type ErrorBoundaryState = {
  readonly error: Error | undefined;
};

// The only class component (observability.md "Crashes"). It never writes storage; the download
// reads the raw stored string, not the possibly broken in-memory state.
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  override state: ErrorBoundaryState = { error: undefined };

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    return { error: error instanceof Error ? error : new Error(String(error)) };
  }

  override render() {
    const { error } = this.state;
    if (error === undefined) {
      return this.props.children;
    }
    return <CrashFallback error={error} />;
  }
}

function handleReloadClick() {
  location.reload();
}

type CrashFallbackProps = {
  readonly error: Error;
};

function CrashFallback({ error }: CrashFallbackProps) {
  const storedText = readStoredProjectText();

  function handleDownloadClick() {
    if (storedText !== undefined) {
      downloadTextFile({ fileName: 'saved-project.json', text: storedText });
    }
  }

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-4 p-6">
      <h1 className="text-lg font-semibold">Something went wrong</h1>
      <p>{error.message}</p>
      <details>
        <summary>Error details</summary>
        <pre className="overflow-auto font-mono text-xs">{error.stack}</pre>
      </details>
      <div className="flex gap-2">
        <Button
          hint={storedText === undefined ? 'Nothing saved in this browser' : undefined}
          isDisabled={storedText === undefined}
          onClick={handleDownloadClick}
          variant="primary"
        >
          Download saved project
        </Button>
        <Button onClick={handleReloadClick} variant="secondary">
          Reload
        </Button>
      </div>
    </main>
  );
}
